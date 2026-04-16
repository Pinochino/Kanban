import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, MessageSquare, Plus } from "lucide-react";
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
import { formatDate, statusOrder, Task, TaskStatus } from "@/domains/projects/taskBoard";
import { IProject, IListTask } from "@/types/ProjectInterface";
import { IUser } from "@/types/UserInterface";

interface TaskDetailDialogProps {
  task: Task | null;
  projectId: string;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated?: () => void;
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
  id: number;
  taskId: number;
  labelId: number;
  title: string;
  color: string;
};

type CommentDto = {
  id: number;
  comment: string;
  account?: { id: number; username: string };
  createdAt?: string;
};

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
  const isTaskEditable = canEditTask ?? !readOnly;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedAccountId, setAssignedAccountId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [reminderDate, setReminderDate] = useState("");

  const [newLabelTitle, setNewLabelTitle] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#2563eb");
  const [newComment, setNewComment] = useState("");

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
  const { data: taskLabelsData } = useGetAllData({ url: taskLabelsUrl, enabled: isTaskEditable && Boolean(task?.id) });
  const taskLabels = useMemo(
    () => (Array.isArray(taskLabelsData) ? (taskLabelsData as TaskLabelDto[]) : []),
    [taskLabelsData],
  );

  const commentsUrl = `${apiName.comments.list}/${task?.id ?? ""}`;
  const { data: commentsData } = useGetAllData({ url: commentsUrl, enabled: canComment && Boolean(task?.id) });
  const comments = useMemo(() => (Array.isArray(commentsData) ? (commentsData as CommentDto[]) : []), [commentsData]);

  const selectedLabelIds = useMemo(() => new Set(taskLabels.map((item) => Number(item.labelId))), [taskLabels]);
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

    return statusOrder[currentIndex + 1].replace("_", " ");
  }, [task]);

  const refreshTaskRelatedData = async () => {
    await queryClient.invalidateQueries({ queryKey: [apiName.projects.list] });
    await queryClient.invalidateQueries({ queryKey: [`${apiName.projects.detail}/${projectId}`] });

    if (task) {
      await queryClient.invalidateQueries({ queryKey: [`${apiName.taskLabels.list}/${task.id}`] });
      await queryClient.invalidateQueries({ queryKey: [`${apiName.comments.list}/${task.id}`] });
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
      await refreshTaskRelatedData();
      onTaskUpdated?.();
      toast.success("Đã cập nhật task");
    },
    onError: () => {
      toast.error("Cập nhật task thất bại");
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
      await refreshTaskRelatedData();
      onTaskUpdated?.();
      toast.success("Đã chuyển task sang giai đoạn tiếp theo");
    },
    onError: () => {
      toast.error("Chuyển trạng thái task thất bại");
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
        },
      });
    },
    onSuccess: async () => {
      setNewLabelTitle("");
      await refreshTaskRelatedData();
      toast.success("Tạo label thành công");
    },
    onError: () => {
      toast.error("Tạo label thất bại");
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
      toast.error("Cập nhật label cho task thất bại");
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
      toast.success("Đã thêm comment");
    },
    onError: () => {
      toast.error("Thêm comment thất bại");
    },
  });

  const handleSaveTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!task) {
      return;
    }

    if (!assignedAccountId || !task.listTaskId) {
      toast.error("Thiếu assignee hoặc trạng thái cột");
      return;
    }

    await updateTaskMutation.mutateAsync();
  };

  if (!task) {
    return null;
  }

  return (
    <Dialog open={Boolean(task)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Task detail: {task.title}</DialogTitle>
          <DialogDescription>
            Quản lý chi tiết task, label và comment theo dữ liệu backend thực.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={isTaskEditable ? handleSaveTask : (event) => event.preventDefault()}>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="task-title">Title</Label>
              <Input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} required disabled={!isTaskEditable} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-[100px]"
                disabled={!isTaskEditable}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-assignee">Assignee</Label>
              <select
                id="task-assignee"
                value={assignedAccountId}
                onChange={(event) => setAssignedAccountId(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
                disabled={!isTaskEditable}
              >
                <option value="">Choose user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-due-date">Due date</Label>
              <Input id="task-due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} disabled={!isTaskEditable} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-reminder-date">Reminder date</Label>
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
                Due: {formatDate(task.dueDate)}
              </div>
            </div>
          </div>

          {isTaskEditable ? (
            <DialogFooter>
              <Button type="submit" disabled={updateTaskMutation.isPending}>
                {updateTaskMutation.isPending ? "Saving..." : "Save task"}
              </Button>
            </DialogFooter>
          ) : null}
        </form>

        {isTaskEditable ? (
          <div className="space-y-3 border-t pt-4">
          <h3 className="font-medium">Labels</h3>

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

          <div className="grid gap-2 md:grid-cols-[1fr_120px_auto]">
            <Input
              value={newLabelTitle}
              onChange={(event) => setNewLabelTitle(event.target.value)}
              placeholder="Label title"
            />
            <Input
              type="color"
              value={newLabelColor}
              onChange={(event) => setNewLabelColor(event.target.value)}
              className="h-10 p-1"
            />
            <Button type="button" onClick={() => createLabelMutation.mutate()}>
              <Plus className="h-4 w-4" />
              Add label
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {taskLabels.map((item) => (
              <Badge key={item.id} variant="secondary" className="border">
                <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.color || "#64748b" }} />
                {item.title}
              </Badge>
            ))}
          </div>
          </div>
        ) : null}

        {canAdvanceStatus ? (
          <div className="space-y-3 border-t pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  {isTaskEditable ? "Bạn có thể chỉnh sửa task này." : "Bạn chỉ có thể comment và chuyển trạng thái task."}
                </p>
                <div className="inline-flex items-center gap-2 rounded-md border p-3">
                  <CalendarDays className="h-4 w-4" />
                  Due: {formatDate(task.dueDate)}
                </div>
              </div>

              {nextListTaskId ? (
                <Button type="button" onClick={() => updateStatusMutation.mutate()} disabled={updateStatusMutation.isPending}>
                  {updateStatusMutation.isPending ? "Updating..." : `Chuyển sang ${nextStatusLabel}`}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {canComment ? (
          <div className="space-y-3 border-t pt-4">
            <h3 className="inline-flex items-center gap-2 font-medium">
              <MessageSquare className="h-4 w-4" />
              Comments
            </h3>

            <div className="space-y-2">
              <Textarea
                value={newComment}
                onChange={(event) => setNewComment(event.target.value)}
                placeholder="Viết comment..."
                className="min-h-[80px]"
              />
              <Button type="button" onClick={() => createCommentMutation.mutate()}>
                Add comment
              </Button>
            </div>

            <div className="space-y-2">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có comment.</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="rounded-md border p-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{comment.account?.username || "Unknown"}</span>
                      <span>{comment.createdAt ? formatDate(comment.createdAt) : ""}</span>
                    </div>
                    <p className="text-sm">{comment.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailDialog;
