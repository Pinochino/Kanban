import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  FileArchive,
  FileImage,
  FileText,
  MessageSquare,
  Paperclip,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { apiName } from "@/api/apiName";
import { handleApi } from "@/api/handleApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGetAllData } from "@/hooks/useGetAllData";
import { useI18n } from "@/i18n/I18nProvider";
import { formatDate, getStatusMeta, statusOrder, Task, TaskStatus } from "@/domains/projects/taskBoard";
import { IProject, IListTask } from "@/types/ProjectInterface";
import { IUser } from "@/types/UserInterface";

interface TaskDetailDialogProps {
  task: Task | null;
  projectId: string;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated?: (updatedTask: Task) => void;
  readOnly?: boolean;
  canEditTask?: boolean;
  canComment?: boolean;
  canAdvanceStatus?: boolean;
}

type LabelDto = {
  id: number;
  title: string;
  color: string;
};

type TaskLabelDto = {
  id?: unknown;
  taskId?: unknown;
  labelId?: unknown;
  label_id?: unknown;
  title?: unknown;
  color?: unknown;
  name?: unknown;
  labelTitle?: unknown;
  labelColor?: unknown;
  labelResponse?: {
    id?: unknown;
    title?: unknown;
    color?: unknown;
    name?: unknown;
  };
  label?: {
    id?: unknown;
    title?: unknown;
    color?: unknown;
    name?: unknown;
  };
};

type NormalizedTaskLabel = {
  id: number;
  labelId: number;
  title: string;
  color?: string;
};

const extractTaskLabelItems = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const dto = payload as {
    items?: unknown;
    content?: unknown;
    data?: unknown;
    taskLabels?: unknown;
    labels?: unknown;
  };

  if (Array.isArray(dto.items)) {
    return dto.items;
  }

  if (Array.isArray(dto.content)) {
    return dto.content;
  }

  if (Array.isArray(dto.taskLabels)) {
    return dto.taskLabels;
  }

  if (Array.isArray(dto.labels)) {
    return dto.labels;
  }

  if (Array.isArray(dto.data)) {
    return dto.data;
  }

  return [];
};

const normalizeTaskLabels = (data: unknown): NormalizedTaskLabel[] => {
  return extractTaskLabelItems(data)
    .map((item, index): NormalizedTaskLabel | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const dto = item as TaskLabelDto;
      const nestedLabel = dto.label && typeof dto.label === "object" ? dto.label : undefined;
      const nestedLabelResponse =
        dto.labelResponse && typeof dto.labelResponse === "object" ? dto.labelResponse : undefined;
      const rawTitle =
        dto.title ??
        dto.name ??
        dto.labelTitle ??
        nestedLabel?.title ??
        nestedLabel?.name ??
        nestedLabelResponse?.title ??
        nestedLabelResponse?.name;
      const rawColor = dto.color ?? dto.labelColor ?? nestedLabel?.color ?? nestedLabelResponse?.color;
      const rawLabelId = dto.labelId ?? dto.label_id ?? nestedLabel?.id ?? nestedLabelResponse?.id;
      const rawId = dto.id ?? rawLabelId ?? index + 1;

      const title = String(rawTitle ?? "").trim();
      if (!title) {
        return null;
      }

      const color = String(rawColor ?? "").trim();
      const parsedLabelId = Number(rawLabelId);
      const parsedId = Number(rawId);

      return {
        id: Number.isFinite(parsedId) ? parsedId : index + 1,
        labelId: Number.isFinite(parsedLabelId) ? parsedLabelId : 0,
        title,
        color: color || undefined,
      };
    })
    .filter((item): item is NormalizedTaskLabel => Boolean(item));
};

type CommentDto = {
  id: number;
  comment: string;
  account?: { id: number; username: string };
  createdAt?: string;
};

type TaskActivityDto = {
  id: number;
  taskId: number;
  actionType: string;
  detail?: string;
  account?: { id: number; username: string };
  createdAt?: string;
};

type TaskAttachmentDto = {
  id: number;
  taskId: number;
  fileName: string;
  fileUrl?: string;
  fileSize: number;
  mimeType: string;
  createdAt?: string;
};

const MAX_ATTACHMENT_SIZE_BYTES = 15 * 1024 * 1024;
const BLOCKED_EXTENSIONS = new Set(["exe", "bat", "cmd", "sh", "msi", "js"]);

const toApiDateTime = (value?: string) => {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.length === 10) {
    return `${trimmed}T00:00:00`;
  }

  if (trimmed.includes(" ") && !trimmed.includes("T")) {
    return trimmed.replace(" ", "T");
  }

  return trimmed;
};

const toDateInputValue = (value?: string) => {
  if (!value) {
    return "";
  }

  return value.includes("T") ? value.slice(0, 10) : value.slice(0, 10);
};

const normalizeStatus = (status?: string | null): TaskStatus => {
  const normalized = String(status ?? "").toLowerCase();

  if (normalized === "to_do") return "todo";
  if (normalized === "in_progress") return "in_progress";
  if (normalized === "review") return "review";
  if (normalized === "done") return "done";
  if (normalized === "todo") return "todo";

  return "todo";
};

const TaskDetailDialog = ({
  task,
  projectId,
  onOpenChange,
  onTaskUpdated,
  readOnly = false,
  canEditTask,
  canComment = true,
  canAdvanceStatus = true,
}: TaskDetailDialogProps) => {
  const queryClient = useQueryClient();
  const { t, language } = useI18n();
  const isTaskEditable = canEditTask ?? !readOnly;
  const statusMeta = useMemo(() => getStatusMeta(language), [language]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedAccountId, setAssignedAccountId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [reminderDate, setReminderDate] = useState("");

  const [newLabelTitle, setNewLabelTitle] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#2563eb");
  const [newComment, setNewComment] = useState("");
  const [selectedAttachmentFile, setSelectedAttachmentFile] = useState<File | null>(null);
  const [isDraggingAttachment, setIsDraggingAttachment] = useState(false);
  const [attachmentQuery, setAttachmentQuery] = useState("");

  useEffect(() => {
    if (!task) {
      return;
    }

    setTitle(task.title ?? "");
    setDescription(task.description ?? "");
    setAssignedAccountId(task.assignedAccountId ?? "");
    setDueDate(toDateInputValue(task.dueDate));
    setReminderDate(toDateInputValue(task.reminderDate));
  }, [task]);

  const { data: projectData } = useGetAllData({
    url: `${apiName.projects.detail}/${projectId}`,
    enabled: Boolean(task?.id && projectId),
  });
  const project = useMemo(() => {
    if (Array.isArray(projectData)) {
      return projectData[0] as IProject | undefined;
    }

    return projectData as IProject | undefined;
  }, [projectData]);

  const { data: usersData } = useGetAllData({ url: apiName.accounts.list, enabled: isTaskEditable });
  const users = useMemo(() => (Array.isArray(usersData) ? (usersData as IUser[]) : []), [usersData]);

  const labelsUrl = `${apiName.labels.list}/${projectId}`;
  const { data: labelsData } = useGetAllData({ url: labelsUrl, enabled: isTaskEditable && Boolean(task && projectId) });
  const labels = useMemo(() => (Array.isArray(labelsData) ? (labelsData as LabelDto[]) : []), [labelsData]);

  const taskLabelsUrl = `${apiName.taskLabels.list}/${task?.id ?? ""}`;
  const { data: taskLabelsData } = useGetAllData({ url: taskLabelsUrl, enabled: Boolean(task?.id) });
  const taskLabels = useMemo(() => normalizeTaskLabels(taskLabelsData), [taskLabelsData]);

  const commentsUrl = `${apiName.comments.list}/${task?.id ?? ""}`;
  const commentsQuery = useGetAllData({ url: commentsUrl, enabled: Boolean(task?.id) });
  const { data: commentsData } = commentsQuery;
  const comments = useMemo(() => (Array.isArray(commentsData) ? (commentsData as CommentDto[]) : []), [commentsData]);

  const taskActivitiesUrl = `${apiName.taskActivities.list}/${task?.id ?? ""}`;
  const { data: taskActivitiesData } = useGetAllData({ url: taskActivitiesUrl, enabled: Boolean(task?.id) });
  const taskActivities = useMemo(
    () => (Array.isArray(taskActivitiesData) ? (taskActivitiesData as TaskActivityDto[]) : []),
    [taskActivitiesData],
  );

  const taskAssignedBy = useMemo(() => {
    const createdActivity = taskActivities.find((activity) => activity.actionType === "CREATE");
    return createdActivity?.account?.username ?? t("taskDetail.unknown");
  }, [taskActivities]);

  const taskAttachmentsUrl = `${apiName.taskAttachments.list}/${task?.id ?? ""}`;
  const taskAttachmentsQuery = useGetAllData({ url: taskAttachmentsUrl, enabled: Boolean(task?.id) });
  const { data: taskAttachmentsData } = taskAttachmentsQuery;
  const taskAttachments = useMemo(
    () => (Array.isArray(taskAttachmentsData) ? (taskAttachmentsData as TaskAttachmentDto[]) : []),
    [taskAttachmentsData],
  );

  useEffect(() => {
    if (!task || !onTaskUpdated) {
      return;
    }

    if (!commentsQuery.isSuccess || !taskAttachmentsQuery.isSuccess) {
      return;
    }

    const nextCommentCount = comments.length;
    const nextAttachmentCount = taskAttachments.length;

    if (task.comments === nextCommentCount && task.attachments === nextAttachmentCount) {
      return;
    }

    onTaskUpdated({
      ...task,
      comments: nextCommentCount,
      attachments: nextAttachmentCount,
    });
  }, [comments.length, onTaskUpdated, task, taskAttachments.length]);

  const filteredAttachments = useMemo(() => {
    const query = attachmentQuery.trim().toLowerCase();
    if (!query) {
      return taskAttachments;
    }

    return taskAttachments.filter((attachment) => {
      const fileName = String(attachment.fileName ?? "").toLowerCase();
      const mimeType = String(attachment.mimeType ?? "").toLowerCase();
      return fileName.includes(query) || mimeType.includes(query);
    });
  }, [taskAttachments, attachmentQuery]);

  const attachmentSummary = useMemo(() => {
    const totalSize = taskAttachments.reduce((sum, attachment) => sum + Number(attachment.fileSize ?? 0), 0);
    return {
      count: taskAttachments.length,
      totalSize,
    };
  }, [taskAttachments]);

  const selectedLabelIds = useMemo(
    () => new Set(taskLabels.map((item) => Number(item.labelId)).filter((value) => Number.isFinite(value) && value > 0)),
    [taskLabels],
  );
  const assignedByName = useMemo(() => {
    const createdActivity = taskActivities.find((activity) => activity.actionType === "CREATE");
    return createdActivity?.account?.username ?? t("taskDetail.unknown");
  }, [taskActivities, t]);
  const nextListTaskId = useMemo(() => {
    if (!project || !task) {
      return "";
    }

    const currentStatus = normalizeStatus(task.status);
    const currentIndex = statusOrder.indexOf(currentStatus);

    if (currentIndex < 0 || currentIndex >= statusOrder.length - 1) {
      return "";
    }

    const nextStatus = statusOrder[currentIndex + 1];
    const nextListTask = project.listTasks?.find((listTask: IListTask) => normalizeStatus(listTask.status) === nextStatus);

    return String(nextListTask?.id ?? "");
  }, [project, task]);

  const nextStatusLabel = useMemo(() => {
    if (!task) {
      return "";
    }

    const currentStatus = normalizeStatus(task.status);
    const currentIndex = statusOrder.indexOf(currentStatus);

    if (currentIndex < 0 || currentIndex >= statusOrder.length - 1) {
      return "";
    }

    return statusMeta[statusOrder[currentIndex + 1]].label;
  }, [statusMeta, task]);

  const nextStatus = useMemo(() => {
    if (!task) {
      return null;
    }

    const currentStatus = normalizeStatus(task.status);
    const currentIndex = statusOrder.indexOf(currentStatus);

    if (currentIndex < 0 || currentIndex >= statusOrder.length - 1) {
      return null;
    }

    return statusOrder[currentIndex + 1];
  }, [task]);

  const refreshTaskRelatedData = async () => {
    if (task) {
      await queryClient.invalidateQueries({ queryKey: [`${apiName.taskLabels.list}/${task.id}`] });
      await queryClient.invalidateQueries({ queryKey: [apiName.taskLabels.list] });
      await queryClient.invalidateQueries({ queryKey: [`${apiName.comments.list}/${task.id}`] });
      await queryClient.invalidateQueries({ queryKey: [`${apiName.taskActivities.list}/${task.id}`] });
      await queryClient.invalidateQueries({ queryKey: [`${apiName.taskAttachments.list}/${task.id}`] });
    }

    await queryClient.invalidateQueries({ queryKey: [`${apiName.labels.list}/${projectId}`] });
  };

  const updateTaskMutation = useMutation({
    mutationFn: async () => {
      if (!task) {
        return null;
      }

      return handleApi({
        url: `${apiName.tasks.update}/${task.id}`,
        method: "PUT",
        withCredentials: true,
        data: {
          title,
          description,
          assignedAccountId: Number(assignedAccountId),
          listTaskId: Number(task.listTaskId),
          dueDate: toApiDateTime(dueDate),
          reminderDate: toApiDateTime(reminderDate),
        },
      });
    },
    onSuccess: async () => {
      const updatedAssignee = users.find((user) => String(user.id) === assignedAccountId);

      onTaskUpdated?.({
        ...task,
        title,
        description,
        assignedAccountId,
        assignee: updatedAssignee?.username ?? task?.assignee ?? t("taskDetail.unknown"),
        dueDate: toApiDateTime(dueDate),
        reminderDate: toApiDateTime(reminderDate),
      } as Task);
      await refreshTaskRelatedData();
      toast.success(language === "vi" ? "Đã cập nhật task" : "Task updated");
    },
    onError: () => {
      toast.error(language === "vi" ? "Cập nhật task thất bại" : "Failed to update task");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!task || !nextListTaskId) {
        return null;
      }

      return handleApi({
        url: `${apiName.tasks.updateStatus}/${task.id}`,
        method: "PATCH",
        withCredentials: true,
        params: {
          listTaskId: Number(nextListTaskId),
        },
      });
    },
    onSuccess: async () => {
      if (task && nextStatus) {
        onTaskUpdated?.({
          ...task,
          listTaskId: nextListTaskId,
          status: nextStatus,
        });
      }
      await refreshTaskRelatedData();
      toast.success(language === "vi" ? "Đã chuyển task sang giai đoạn tiếp theo" : "Task moved to the next stage");
    },
    onError: () => {
      toast.error(language === "vi" ? "Chuyển trạng thái task thất bại" : "Failed to change task status");
    },
  });

  const createLabelMutation = useMutation({
    mutationFn: async () => {
      if (!newLabelTitle.trim()) {
        throw new Error("Label title is required");
      }

      return handleApi({
        url: apiName.labels.create,
        method: "POST",
        withCredentials: true,
        data: {
          title: newLabelTitle.trim(),
          color: newLabelColor,
          projectId: Number(projectId),
          taskId: Number(task.id),
        },
      });
    },
    onSuccess: async () => {
      setNewLabelTitle("");
      await refreshTaskRelatedData();
      toast.success(language === "vi" ? "Tạo label thành công" : "Label created successfully");
    },
    onError: () => {
      toast.error(language === "vi" ? "Tạo label thất bại" : "Failed to create label");
    },
  });

  const toggleTaskLabelMutation = useMutation({
    mutationFn: async (labelId: number) => {
      if (!task) {
        return null;
      }

      return handleApi({
        url: apiName.taskLabels.toggle,
        method: "POST",
        withCredentials: true,
        params: {
          taskId: Number(task.id),
          labelId,
        },
      });
    },
    onSuccess: async () => {
      await refreshTaskRelatedData();
    },
    onError: () => {
      toast.error(language === "vi" ? "Cập nhật label cho task thất bại" : "Failed to update task labels");
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async () => {
      if (!task) {
        return null;
      }

      if (!newComment.trim()) {
        throw new Error("Comment is required");
      }

      return handleApi({
        url: apiName.comments.create,
        method: "POST",
        withCredentials: true,
        data: {
          taskId: Number(task.id),
          comment: newComment.trim(),
        },
      });
    },
    onSuccess: async () => {
      setNewComment("");
      await refreshTaskRelatedData();
      toast.success(language === "vi" ? "Đã thêm comment" : "Comment added");
    },
    onError: () => {
      toast.error(language === "vi" ? "Thêm comment thất bại" : "Failed to add comment");
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: async () => {
      if (!task) {
        return null;
      }

      if (!selectedAttachmentFile) {
        throw new Error("Attachment file is required");
      }

      const formData = new FormData();
      formData.append("file", selectedAttachmentFile);

      return handleApi({
        url: `${apiName.taskAttachments.upload}/${task.id}`,
        method: "POST",
        withCredentials: true,
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: async () => {
      setSelectedAttachmentFile(null);
      await refreshTaskRelatedData();
      toast.success(language === "vi" ? "Tải file đính kèm thành công" : "Attachment uploaded successfully");
    },
    onError: () => {
      toast.error(language === "vi" ? "Tải file đính kèm thất bại" : "Failed to upload attachment");
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: number) =>
      handleApi({
        url: `${apiName.taskAttachments.delete}/${attachmentId}`,
        method: "DELETE",
        withCredentials: true,
      }),
    onSuccess: async () => {
      await refreshTaskRelatedData();
      toast.success(language === "vi" ? "Đã xóa file đính kèm" : "Attachment deleted");
    },
    onError: () => {
      toast.error(language === "vi" ? "Xóa file đính kèm thất bại" : "Failed to delete attachment");
    },
  });

  const handleSaveTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!task) {
      return;
    }

    if (!assignedAccountId || !task.listTaskId) {
      toast.error(language === "vi" ? "Thiếu assignee hoặc trạng thái cột" : "Assignee or column status is missing");
      return;
    }

    await updateTaskMutation.mutateAsync();
  };

  const formatFileSize = (size: number) => {
    if (!Number.isFinite(size) || size < 0) {
      return "0 B";
    }

    if (size < 1024) {
      return `${size} B`;
    }

    const kb = size / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }

    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const validateAttachmentFile = (file: File | null) => {
    if (!file) {
      return false;
    }

    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      toast.error(language === "vi" ? "File vượt quá 15MB" : "File exceeds 15MB");
      return false;
    }

    const lowerName = file.name.toLowerCase();
    const dotIndex = lowerName.lastIndexOf(".");
    if (dotIndex > -1 && dotIndex < lowerName.length - 1) {
      const extension = lowerName.slice(dotIndex + 1);
      if (BLOCKED_EXTENSIONS.has(extension)) {
        toast.error(language === "vi" ? "Định dạng file không được hỗ trợ" : "File format is not supported");
        return false;
      }
    }

    return true;
  };

  const onAttachmentFileSelected = (file: File | null) => {
    if (!validateAttachmentFile(file)) {
      return;
    }

    setSelectedAttachmentFile(file);
  };

  const getAttachmentIcon = (mimeType?: string) => {
    const value = String(mimeType ?? "").toLowerCase();
    if (value.startsWith("image/")) {
      return <FileImage className="h-4 w-4" />;
    }
    if (value.includes("zip") || value.includes("rar") || value.includes("tar") || value.includes("7z")) {
      return <FileArchive className="h-4 w-4" />;
    }

    return <FileText className="h-4 w-4" />;
  };

  const downloadAttachment = async (attachment: TaskAttachmentDto) => {
    try {
      const response = await handleApi({
        url: `${apiName.taskAttachments.download}/${attachment.id}`,
        method: "GET",
        responseType: "blob",
        withCredentials: true,
      });

      const contentDisposition = String(response.headers?.["content-disposition"] ?? "");
      const utf8NameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
      const quotedNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
      const extractedName = utf8NameMatch?.[1]
        ? decodeURIComponent(utf8NameMatch[1])
        : quotedNameMatch?.[1];
      const fileName = extractedName || attachment.fileName || `attachment-${attachment.id}`;

      const blob = new Blob([response.data], {
        type: attachment.mimeType || "application/octet-stream",
      });

      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch {
      toast.error(language === "vi" ? "Không thể tải file" : "Unable to download file");
    }
  };

  if (!task) {
    return null;
  }

  return (
    <Dialog open={Boolean(task)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{language === "vi" ? "Chi tiết task" : "Task detail"}: {task.title}</DialogTitle>
          <DialogDescription>
            {language === "vi"
              ? "Quản lý chi tiết task, label và comment theo dữ liệu backend thực."
              : "Manage task details, labels, and comments from the backend data."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={isTaskEditable ? handleSaveTask : (event) => event.preventDefault()}>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="task-title">{language === "vi" ? "Tiêu đề" : "Title"}</Label>
              <Input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} required disabled={!isTaskEditable} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="task-description">{language === "vi" ? "Mô tả" : "Description"}</Label>
              <Textarea
                id="task-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-[100px]"
                disabled={!isTaskEditable}
              />
            </div>

            {isTaskEditable ? (
              <div className="space-y-2">
                <Label htmlFor="task-assignee">{language === "vi" ? "Người phụ trách" : "Assignee"}</Label>
                <select
                  id="task-assignee"
                  value={assignedAccountId}
                  onChange={(event) => setAssignedAccountId(event.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                  disabled={!isTaskEditable}
                >
                  <option value="">{language === "vi" ? "Chọn người dùng" : "Choose user"}</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="task-due-date">{language === "vi" ? "Hạn hoàn thành" : "Due date"}</Label>
              <Input id="task-due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} disabled={!isTaskEditable} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-reminder-date">{language === "vi" ? "Ngày nhắc" : "Reminder date"}</Label>
              <Input
                id="task-reminder-date"
                type="date"
                value={reminderDate}
                onChange={(event) => setReminderDate(event.target.value)}
                disabled={!isTaskEditable}
              />
            </div>

            <div className="rounded-md border p-3 text-sm text-muted-foreground">
              <div className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {language === "vi" ? "Hạn:" : "Due:"} {formatDate(task.dueDate, language)}
              </div>
            </div>

            {!isTaskEditable ? (
              <div className="rounded-md border p-3 text-sm text-muted-foreground">
                <div className="space-y-1">
                  <p>
                    <span className="font-medium text-foreground">{t("taskDetail.assignedTo")}:</span> {task.assignee || t("taskDetail.unknown")}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">{t("taskDetail.assignedBy")}:</span> {assignedByName}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {isTaskEditable ? (
            <DialogFooter>
              <Button type="submit" disabled={updateTaskMutation.isPending}>
                {updateTaskMutation.isPending ? (language === "vi" ? "Đang lưu..." : "Saving...") : language === "vi" ? "Lưu task" : "Save task"}
              </Button>
            </DialogFooter>
          ) : null}
        </form>

        <div className="space-y-3 border-t pt-4">

      

          {isTaskEditable ? (
            <>
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => {
                  const isSelected = selectedLabelIds.has(Number(label.id));

                  return (
                    <Button
                      key={label.id}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      className="h-8"
                      onClick={() => toggleTaskLabelMutation.mutate(Number(label.id))}
                    >
                      <span
                        className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: label.color || "#64748b" }}
                      />
                      {label.title}
                    </Button>
                  );
                })}
              </div>

           
            </>
          ) : null}
        </div>

        {canAdvanceStatus ? (
          <div className="space-y-3 border-t pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    {isTaskEditable
                      ? language === "vi"
                        ? "Bạn có thể chỉnh sửa task này."
                        : "You can edit this task."
                      : language === "vi"
                        ? "Bạn chỉ có thể comment và chuyển trạng thái task."
                        : "You can only comment and change the task status."}
                  </p>
                <div className="inline-flex items-center gap-2 rounded-md border p-3">
                  <CalendarDays className="h-4 w-4" />
                  {language === "vi" ? "Hạn:" : "Due:"} {formatDate(task.dueDate, language)}
                </div>
              </div>

              {nextListTaskId ? (
                <Button type="button" onClick={() => updateStatusMutation.mutate()} disabled={updateStatusMutation.isPending}>
                  {updateStatusMutation.isPending
                    ? language === "vi"
                      ? "Đang cập nhật..."
                      : "Updating..."
                    : language === "vi"
                      ? `Chuyển sang ${nextStatusLabel}`
                      : `Move to ${nextStatusLabel}`}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {canComment ? (
          <div className="space-y-3 border-t pt-4">
            <h3 className="inline-flex items-center gap-2 font-medium">
              <MessageSquare className="h-4 w-4" />
              {language === "vi" ? "Bình luận" : "Comments"}
            </h3>

            <div className="space-y-2">
              <Textarea
                value={newComment}
                onChange={(event) => setNewComment(event.target.value)}
                placeholder={language === "vi" ? "Viết comment..." : "Write a comment..."}
                className="min-h-[80px]"
              />
              <Button type="button" onClick={() => createCommentMutation.mutate()}>
                {language === "vi" ? "Thêm comment" : "Add comment"}
              </Button>
            </div>

            <div className="space-y-2">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">{language === "vi" ? "Chưa có comment." : "No comments yet."}</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="rounded-md border p-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{comment.account?.username || "Unknown"}</span>
                      <span>{comment.createdAt ? formatDate(comment.createdAt, language) : ""}</span>
                    </div>
                    <p className="text-sm">{comment.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}

        <div className="space-y-3 border-t pt-4">
          <h3 className="inline-flex items-center gap-2 font-medium">
            <Paperclip className="h-4 w-4" />
            {language === "vi" ? "File đính kèm" : "Attachments"}
          </h3>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border px-2 py-1">{attachmentSummary.count} {language === "vi" ? "file" : "files"}</span>
            <span className="rounded-full border px-2 py-1">{formatFileSize(attachmentSummary.totalSize)}</span>
          </div>

          {isTaskEditable ? (
            <div
              className={`space-y-3 rounded-lg border p-3 transition-colors ${
                isDraggingAttachment ? "border-primary bg-primary/5" : "border-dashed"
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDraggingAttachment(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDraggingAttachment(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDraggingAttachment(false);
                onAttachmentFileSelected(event.dataTransfer.files?.[0] ?? null);
              }}
            >
              <p className="text-xs text-muted-foreground">
                {language === "vi"
                  ? "Kéo thả file vào đây hoặc chọn file thủ công. Tối đa 15MB."
                  : "Drag and drop a file here or choose one manually. Maximum 15MB."}
              </p>

              <div className="flex flex-wrap items-center gap-2">
              <Input
                type="file"
                onChange={(event) => onAttachmentFileSelected(event.target.files?.[0] ?? null)}
                className="max-w-sm"
              />
              <Button
                type="button"
                onClick={() => uploadAttachmentMutation.mutate()}
                disabled={!selectedAttachmentFile || uploadAttachmentMutation.isPending}
              >
                <Upload className="h-4 w-4" />
                {uploadAttachmentMutation.isPending ? (language === "vi" ? "Đang tải..." : "Uploading...") : language === "vi" ? "Tải lên" : "Upload"}
              </Button>
              </div>

              {selectedAttachmentFile ? (
                <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                  <span className="truncate">
                    {selectedAttachmentFile.name} ({formatFileSize(selectedAttachmentFile.size)})
                  </span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedAttachmentFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={attachmentQuery}
              onChange={(event) => setAttachmentQuery(event.target.value)}
              placeholder={language === "vi" ? "Tìm file theo tên hoặc type" : "Search files by name or type"}
              className="pl-9"
            />
          </div>

          <div className="space-y-2">
            {filteredAttachments.length === 0 ? (
              <p className="text-sm text-muted-foreground">{language === "vi" ? "Chưa có file đính kèm." : "No attachments yet."}</p>
            ) : (
              filteredAttachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => void downloadAttachment(attachment)}
                      className="flex items-center gap-2 truncate text-sm font-medium underline-offset-2 hover:underline"
                    >
                      {getAttachmentIcon(attachment.mimeType)}
                      {attachment.fileName}
                    </button>
                    <p className="text-xs text-muted-foreground">
                      {attachment.mimeType || "application/octet-stream"} • {formatFileSize(Number(attachment.fileSize ?? 0))}
                      {attachment.createdAt ? ` • ${formatDate(attachment.createdAt, language)}` : ""}
                    </p>
                  </div>

                  {isTaskEditable ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAttachmentMutation.mutate(Number(attachment.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3 border-t pt-4">
          <h3 className="font-medium">{language === "vi" ? "Lịch sử hoạt động" : "Task activities"}</h3>

          <div className="space-y-2">
            {taskActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">{language === "vi" ? "Chưa có lịch sử hoạt động." : "No activity history yet."}</p>
            ) : (
              taskActivities.map((activity) => (
                <div key={activity.id} className="rounded-md border p-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{activity.account?.username || t("taskDetail.unknown")}</span>
                    <span>{activity.createdAt ? formatDate(activity.createdAt, language) : ""}</span>
                  </div>
                  <p className="text-sm font-medium">{activity.actionType}</p>
                  <p className="text-sm text-muted-foreground">{activity.detail || (language === "vi" ? "Không có mô tả" : "No detail")}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailDialog;
