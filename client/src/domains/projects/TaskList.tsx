import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CheckCircle2,
  Clock3,
  Grid2x2,
  GripVertical,
  Kanban,
  LayoutList,
  Loader2,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { apiName } from "@/api/apiName";
import { handleApi } from "@/api/handleApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import CreateTaskDialog from "@/components/common/dialog/CreateTaskDialog";
import TaskDetailDialog from "@/components/common/dialog/TaskDetailDialog";
import { defaultNewTask, formatDate, getPriorityMeta, getStatusMeta, initials, statusOrder, Task, TaskPriority, TaskStatus } from "@/domains/projects/taskBoard";
import { ICreateTask } from "@/types/TaskInterface";
import { IProject, IListTask, ITask } from "@/types/ProjectInterface";
import { FormEvent } from "react";
import useDebounce from "@/hooks/useDebounce";
import { useMinVisibleLoading } from "@/hooks/useMinimumLoading";
import { AxiosError } from "axios";
import { useI18n } from "@/i18n/I18nProvider";
import type { Language } from "@/i18n/messages";

interface TaskListProps {
  projectList: IProject[];
  selectedProjectId?: string | number | null;
  tasks?: Task[];
  currentUserId?: string | number | null;
  canManageTasks?: boolean;
  allowTaskDrag?: boolean;
}

type TaskSearchPage = {
  items: Task[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

type TaskDateErrors = {
  dueDate?: string;
  reminderDate?: string;
};

const TASK_PAGE_SIZE_OPTIONS = [5, 10, 15, 20] as const;

const normalizeStatus = (status?: string | null): TaskStatus => {
  const normalized = (status ?? "").toLowerCase();

  if (normalized === "to_do") return "todo";
  if (normalized === "in_progress") return "in_progress";
  if (normalized === "review") return "review";
  if (normalized === "done") return "done";
  if (normalized === "todo" || normalized === "backlog") return "todo";

  return "todo";
};

const toBackendStatusFilter = (status: "all" | TaskStatus): string | undefined => {
  if (status === "all") {
    return undefined;
  }

  if (status === "todo") {
    return "to_do";
  }

  return status;
};

const parseDueDate = (value?: string) => {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
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

const validateTaskDates = (dueDate: string, reminderDate: string, language: Language): TaskDateErrors => {
  const errors: TaskDateErrors = {};

  if (dueDate) {
    const dueDateTime = new Date(`${dueDate}T00:00:00`);
    if (Number.isNaN(dueDateTime.getTime()) || dueDateTime.getTime() <= Date.now()) {
      errors.dueDate = language === "vi" ? "Hạn hoàn thành phải ở tương lai." : "Due date must be in the future.";
    }
  }

  if (dueDate && reminderDate) {
    const dueDateTime = new Date(`${dueDate}T00:00:00`);
    const reminderDateTime = new Date(`${reminderDate}T00:00:00`);

    if (!Number.isNaN(dueDateTime.getTime()) && !Number.isNaN(reminderDateTime.getTime()) && reminderDateTime.getTime() > dueDateTime.getTime()) {
      errors.reminderDate =
        language === "vi"
          ? "Ngày nhắc phải trước hoặc bằng hạn hoàn thành."
          : "Reminder date must be on or before the due date.";
    }
  }

  return errors;
};

const extractApiErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }

    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
};

const buildTaskFromApi = (
  task: ITask,
  projectId: string | number,
  listStatus?: string | null,
  parentListTaskId?: string | number,
): Task => ({
  id: String(task.id),
  projectId: String(projectId),
  listTaskId: task.listTaskId ? String(task.listTaskId) : parentListTaskId ? String(parentListTaskId) : undefined,
  orderIndex: typeof task.orderIndex === "number" ? task.orderIndex : undefined,
  assignedAccountId: task.assignedAccount?.id ? String(task.assignedAccount.id) : undefined,
  title: task.title,
  description: task.description ?? "",
  status: normalizeStatus(listStatus ?? task.listTaskStatus),
  priority: "medium",
  assignee: task.assignedAccount?.username ?? "",
  dueDate: task.dueDate ?? "",
  reminderDate: task.reminderDate ?? "",
  checklistDone: 0,
  checklistTotal: 0,
  comments: 0,
  attachments: 0,
  tags: [],
});

const sortTasks = (items: Task[]) =>
  [...items].sort((left, right) => {
    const leftOrderIndex = left.orderIndex ?? Number.POSITIVE_INFINITY;
    const rightOrderIndex = right.orderIndex ?? Number.POSITIVE_INFINITY;

    if (leftOrderIndex !== rightOrderIndex) {
      return leftOrderIndex - rightOrderIndex;
    }

    const dueDateDifference = parseDueDate(left.dueDate) - parseDueDate(right.dueDate);

    if (dueDateDifference !== 0) {
      return dueDateDifference;
    }

    const leftId = Number(left.id);
    const rightId = Number(right.id);

    if (!Number.isNaN(leftId) && !Number.isNaN(rightId)) {
      return leftId - rightId;
    }

    return left.id.localeCompare(right.id);
  });

const buildTaskUpdatePayload = (task: Task, listTaskId: string, orderIndex: number) => ({
  title: task.title,
  description: task.description,
  assignedAccountId: Number(task.assignedAccountId ?? 0),
  listTaskId: Number(listTaskId),
  dueDate: toApiDateTime(task.dueDate),
  reminderDate: toApiDateTime(task.reminderDate),
  orderIndex,
});

const TaskBoardCard = ({
  task,
  onOpenDetail,
  canDrag,
  language,
  t,
  priorityMeta,
}: {
  task: Task;
  onOpenDetail: (task: Task) => void;
  canDrag: boolean;
  language: Language;
  t: (key: string) => string;
  priorityMeta: Record<TaskPriority, { label: string; badgeClass: string }>;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="w-full min-w-0 cursor-grab border bg-card/95 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
      {...(canDrag ? { ...attributes, ...listeners } : {})}
      onClick={() => onOpenDetail(task)}
    >
      <CardContent className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <p className="line-clamp-2 font-medium">{task.title}</p>
            <p className="truncate text-xs text-muted-foreground">{task.id}</p>
          </div>
          <Badge variant="outline" className={priorityMeta[task.priority].badgeClass}>
            {priorityMeta[task.priority].label}
          </Badge>
        </div>

        <div className="flex justify-end">
          {canDrag ? (
            <button
              type="button"
              className="inline-flex h-6 w-6 items-center justify-center rounded border border-border/70 bg-background text-muted-foreground hover:bg-muted"
              onClick={(event) => event.stopPropagation()}
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-1">
          {task.tags.length > 0 ? (
            task.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                {tag}
              </Badge>
            ))
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              {t("taskBoard.noTags")}
            </Badge>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <LayoutList className="h-3.5 w-3.5" />
              {t("taskBoard.tableChecklist")}
            </span>
            <span>
              {task.checklistDone}/{task.checklistTotal}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary"
              style={{
                width:
                  task.checklistTotal > 0
                    ? `${Math.round((task.checklistDone / task.checklistTotal) * 100)}%`
                    : task.status === "done"
                      ? "100%"
                      : "0%",
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5" />
            {formatDate(task.dueDate, language)}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {task.comments}
            </span>
            <span className="inline-flex items-center gap-1">
              <Paperclip className="h-3.5 w-3.5" />
              {task.attachments}
            </span>
          </span>
        </div>

        <div className="flex items-center justify-between border-t pt-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={task.assigneeAvatar} alt={task.assignee} />
              <AvatarFallback className="text-[11px]">{initials(task.assignee)}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium">{task.assignee || t("taskBoard.unassigned")}</span>
          </div>

          {task.status === "done" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
        </div>
      </CardContent>
    </Card>
  );
};

const TaskBoardColumn = ({
  status,
  title,
  tasks,
  onAddTask,
  onOpenTaskDetail,
  canManageTasks,
  canDragTasks,
  statusMeta,
  priorityMeta,
  language,
  t,
}: {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onAddTask: () => void;
  onOpenTaskDetail: (task: Task) => void;
  canManageTasks: boolean;
  canDragTasks: boolean;
  statusMeta: Record<TaskStatus, { label: string; columnClass: string; badgeClass: string }>;
  priorityMeta: Record<TaskPriority, { label: string; badgeClass: string }>;
  language: Language;
  t: (key: string) => string;
}) => {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <Card
      className={cn(
        "w-full min-w-0 border-2 shadow-sm transition-all duration-200 xl:min-w-[260px]",
        statusMeta[status].columnClass,
      )}
    >
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant="secondary">{tasks.length}</Badge>
        </div>
        {canManageTasks ? (
          <Button variant="outline" size="sm" className="w-full justify-start" onClick={onAddTask}>
            <Plus className="h-4 w-4" />
            {t("taskBoard.addTaskTo")} {title}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent ref={setNodeRef} className="space-y-3 p-3">
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskBoardCard
              key={task.id}
              task={task}
              onOpenDetail={onOpenTaskDetail}
              canDrag={canDragTasks}
              language={language}
              t={t}
              priorityMeta={priorityMeta}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 ? (
          <div className="rounded-md border border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground dark:bg-muted/20">
            {t("taskBoard.emptyColumn")}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

const SprintBoardLoading = () => (
  <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 2xl:grid-cols-4">
    {Array.from({ length: 4 }).map((_, columnIndex) => (
      <Card key={columnIndex} className="w-full min-w-0 border-2 shadow-sm xl:min-w-[260px]">
        <CardHeader className="space-y-3 pb-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-full" />
        </CardHeader>
        <CardContent className="space-y-3 p-3">
          {Array.from({ length: 3 }).map((_, cardIndex) => (
            <div key={cardIndex} className="space-y-2 rounded-md border bg-card/90 p-3 dark:bg-card/80">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    ))}
  </div>
);

const SprintTableLoading = () => (
  <div className="overflow-x-auto rounded-md border border-border/70 bg-card/80 p-2">
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-8 gap-2 rounded-md border p-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  </div>
);

const TaskList = ({
  projectList,
  selectedProjectId,
  tasks,
  currentUserId,
  canManageTasks = true,
  allowTaskDrag,
}: TaskListProps) => {
  const queryClient = useQueryClient();
  const { language, t } = useI18n();
  const [search, setSearch] = useState<string>("");
  const [viewMode, setViewMode] = useState<"table" | "kanban">("kanban");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [createTaskProjectId, setCreateTaskProjectId] = useState<string>("");
  const [createTaskListTaskId, setCreateTaskListTaskId] = useState<string>("");
  const [createTaskColumnLabel, setCreateTaskColumnLabel] = useState<string>("");
  const [taskForm, setTaskForm] = useState<ICreateTask>(defaultNewTask);
  const [taskFormErrors, setTaskFormErrors] = useState<TaskDateErrors>({});
  const [boardTasks, setBoardTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const debouncedSearch = useDebounce({ value: search, delay: 400 });

  const sensor = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }));
  const canDragTasks = allowTaskDrag ?? canManageTasks;
  const statusMeta = useMemo(() => getStatusMeta(language), [language]);
  const priorityMeta = useMemo(() => getPriorityMeta(language), [language]);

  const projectMap = useMemo(
    () =>
      ((Array.isArray(projectList) && Array.from(projectList)) || []).reduce(
        (acc, project) => {
          acc[String(project.id)] = project;
          return acc;
        },
        {} as Record<string, IProject>,
      ),
    [projectList],
  );

  const selectedProject = selectedProjectId ? projectMap[String(selectedProjectId)] : null;
  const boardProject = selectedProject ?? null;
  const effectiveProjectFilter = selectedProjectId ? String(selectedProjectId) : projectFilter;
  const keyword = String(debouncedSearch ?? "").trim();
  const statusQuery = toBackendStatusFilter(statusFilter);
  const isKanbanView = viewMode === "kanban";
  const backendPage = Math.max(currentPage - 1, 0);

  const { data: searchedTaskPage, isFetching: isSearchingTasks } = useQuery({
    queryKey: [
      apiName.tasks.search,
      keyword,
      effectiveProjectFilter,
      currentUserId,
      statusQuery,
      isKanbanView,
      isKanbanView ? "all" : backendPage,
      isKanbanView ? "all" : pageSize,
    ],
    queryFn: async () => {
      const projectIdNumber =
        effectiveProjectFilter !== "all" && !Number.isNaN(Number(effectiveProjectFilter))
          ? Number(effectiveProjectFilter)
          : undefined;
      const assignedAccountIdNumber =
        currentUserId !== null && currentUserId !== undefined && !Number.isNaN(Number(currentUserId))
          ? Number(currentUserId)
          : undefined;

      const fetchTaskSearchPage = async (page?: number, size?: number) =>
        handleApi({
          url: apiName.tasks.search,
          method: "GET",
          params: {
            keyword,
            ...(statusQuery ? { status: statusQuery } : {}),
            ...(projectIdNumber ? { projectId: projectIdNumber } : {}),
            ...(assignedAccountIdNumber ? { assignedAccountId: assignedAccountIdNumber } : {}),
            ...(typeof page === "number" ? { page } : {}),
            ...(typeof size === "number" ? { size } : {}),
          },
          withCredentials: true,
        });

      if (isKanbanView) {
        const allTasks: ITask[] = [];
        let nextPage = 0;
        const requestSize = 50;
        let totalElements = 0;
        let hasNext = true;
        let safetyCounter = 0;

        while (hasNext && safetyCounter < 100) {
          const response = await fetchTaskSearchPage(nextPage, requestSize);
          const payload = response.data?.data;
          const taskItems = Array.isArray(payload?.items)
            ? (payload.items as ITask[])
            : Array.isArray(payload)
              ? (payload as ITask[])
              : [];

          allTasks.push(...taskItems);
          totalElements = Number(payload?.totalElements ?? allTasks.length);
          hasNext = Boolean(payload?.hasNext ?? false);
          nextPage += 1;
          safetyCounter += 1;

          if (taskItems.length === 0) {
            hasNext = false;
          }
        }

        const mappedTasks = sortTasks(
          allTasks.map((task) =>
            buildTaskFromApi(
              task,
              task.projectId ?? selectedProjectId ?? effectiveProjectFilter,
              task.listTaskStatus,
              task.listTaskId,
            ),
          ),
        );

        return {
          items: mappedTasks,
          totalElements: totalElements || mappedTasks.length,
          totalPages: 1,
          page: 0,
          size: mappedTasks.length,
          hasNext: false,
          hasPrevious: false,
        } as TaskSearchPage;
      }

      const response = await fetchTaskSearchPage(backendPage, pageSize);
      const payload = response.data?.data;
      const taskItems = Array.isArray(payload?.items)
        ? (payload.items as ITask[])
        : Array.isArray(payload)
          ? (payload as ITask[])
          : [];

      const mappedTasks = sortTasks(
        taskItems.map((task) =>
          buildTaskFromApi(
            task,
            task.projectId ?? selectedProjectId ?? effectiveProjectFilter,
            task.listTaskStatus,
            task.listTaskId,
          ),
        ),
      );

      return {
        items: mappedTasks,
        totalElements: Number(payload?.totalElements ?? mappedTasks.length),
        totalPages: Number(payload?.totalPages ?? (mappedTasks.length > 0 ? 1 : 0)),
        page: Number(payload?.page ?? backendPage),
        size: Number(payload?.size ?? pageSize),
        hasNext: Boolean(payload?.hasNext ?? false),
        hasPrevious: Boolean(payload?.hasPrevious ?? backendPage > 0),
      } as TaskSearchPage;
    },
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    setBoardTasks(searchedTaskPage?.items ?? []);
  }, [searchedTaskPage]);

  const paginatedTasks = useMemo(() => boardTasks, [boardTasks]);
  const totalTasks = searchedTaskPage?.totalElements ?? 0;
  const totalPages = Math.max(1, searchedTaskPage?.totalPages ?? 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = totalTasks === 0 ? 0 : (safeCurrentPage - 1) * pageSize;
  const pageEnd = totalTasks === 0 ? 0 : Math.min(pageStart + paginatedTasks.length, totalTasks);
  const canChangeTaskState = Boolean(boardProject);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, statusFilter, effectiveProjectFilter, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const groupedTasks = useMemo(() => {
    return statusOrder.reduce(
      (acc, status) => {
        acc[status] = paginatedTasks.filter((task) => task.status === status);
        return acc;
      },
      {
        todo: [],
        in_progress: [],
        review: [],
        done: [],
      } as Record<TaskStatus, Task[]>,
    );
  }, [paginatedTasks]);

  const listTasksByStatus = useMemo(() => {
    const result = new Map<TaskStatus, IListTask | null>();

    boardProject?.listTasks?.forEach((listTask) => {
      const status = normalizeStatus(listTask.status);
      result.set(status, listTask);
    });

    return result;
  }, [boardProject]);

  const listTaskById = useMemo(() => {
    const result = new Map<string, IListTask>();

    boardProject?.listTasks?.forEach((listTask) => {
      result.set(String(listTask.id), listTask);
    });

    return result;
  }, [boardProject]);

  const refreshTaskBoardQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: [apiName.projects.list] });

    if (selectedProjectId) {
      await queryClient.invalidateQueries({
        queryKey: [`${apiName.projects.detail}/${selectedProjectId}`],
      });
    }

    await queryClient.invalidateQueries({ queryKey: [apiName.tasks.list] });
    await queryClient.invalidateQueries({ queryKey: [apiName.tasks.search] });
    await queryClient.refetchQueries({ queryKey: [apiName.tasks.search], type: "active" });
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setSelectedTask(updatedTask);
    setBoardTasks((previousTasks) =>
      sortTasks(
        previousTasks.map((task) =>
          task.id === updatedTask.id
            ? {
                ...task,
                ...updatedTask,
              }
            : task,
        ),
      ),
    );
  };

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, listTaskId }: { taskId: string; listTaskId: string }) => {
      return handleApi({
        url: `${apiName.tasks.updateStatus}/${taskId}`,
        method: "PATCH",
        params: { listTaskId: Number(listTaskId) },
        withCredentials: true,
      });
    },
    onSuccess: (_response, variables) => {
      const nextStatus = listTasksByStatus.entries();
      const matchedListTask = Array.from(nextStatus).find(([, listTask]) => String(listTask?.id ?? "") === variables.listTaskId)?.[0];

      if (matchedListTask) {
        setBoardTasks((previousTasks) =>
          sortTasks(
            previousTasks.map((task) =>
              task.id === variables.taskId
                ? {
                    ...task,
                    listTaskId: variables.listTaskId,
                    status: matchedListTask,
                  }
                : task,
            ),
          ),
        );

        setSelectedTask((previousTask) =>
          previousTask && previousTask.id === variables.taskId
            ? {
                ...previousTask,
                listTaskId: variables.listTaskId,
                status: matchedListTask,
              }
            : previousTask,
        );
      }

      toast.success(language === "vi" ? "Đã cập nhật trạng thái task" : "Task status updated");
    },
    onError: (error) => {
      toast.error(extractApiErrorMessage(error, language === "vi" ? "Cập nhật trạng thái task thất bại" : "Failed to update task status"));
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (task: Task) => {
      const assignedAccountId = task.assignedAccountId ?? currentUserId;

      if (!assignedAccountId || !task.listTaskId) {
        throw new Error("Thiếu thông tin cần thiết để xóa task");
      }

      return handleApi({
        url: apiName.tasks.delete,
        method: "DELETE",
        params: {
          taskId: Number(task.id),
          assignedAccountId: Number(assignedAccountId),
          listTaskId: Number(task.listTaskId),
        },
        withCredentials: true,
      });
    },
    onSuccess: (_response, task) => {
      setBoardTasks((previousTasks) => previousTasks.filter((item) => item.id !== task.id));
      setSelectedTask((previousTask) => (previousTask?.id === task.id ? null : previousTask));
      toast.success(language === "vi" ? "Đã xóa task" : "Task deleted");
    },
    onError: (error) => {
      toast.error(extractApiErrorMessage(error, "Xóa task thất bại"));
    },
  });

  const handleChangeRowTaskStatus = (task: Task, nextStatus: TaskStatus) => {
    const targetListTask = listTasksByStatus.get(nextStatus);

    if (!targetListTask) {
      toast.error(language === "vi" ? "Không tìm thấy cột trạng thái tương ứng trong project này" : "No matching status column was found in this project");
      return;
    }

    updateTaskStatusMutation.mutate({
      taskId: task.id,
      listTaskId: String(targetListTask.id),
    });
  };

  const saveTaskOrder = async (tasksToPersist: Task[]) => {
    await Promise.all(
      tasksToPersist.map((task, index) =>
        handleApi({
          url: `${apiName.tasks.update}/${task.id}`,
          method: "PUT",
          data: buildTaskUpdatePayload(task, task.listTaskId ?? "", index),
          withCredentials: true,
        }),
      ),
    );
  };

  const createTaskMutation = useMutation({
    mutationFn: async (payload: ICreateTask) => {
      return handleApi({
        url: apiName.tasks.create,
        method: "POST",
        data: {
          ...payload,
          assignedAccountId: Number(payload.assignedAccountId),
          listTaskId: Number(payload.listTaskId),
          dueDate: toApiDateTime(payload.dueDate),
          reminderDate: toApiDateTime(payload.reminderDate),
          projectId: payload.projectId ? Number(payload.projectId) : undefined,
        },
        withCredentials: true,
      });
    },
    onSuccess: (response) => {
      setCurrentPage(1);
      setIsCreateTaskDialogOpen(false);
      setTaskForm(defaultNewTask);
      setCreateTaskProjectId("");
      setCreateTaskListTaskId("");
      setCreateTaskColumnLabel("");
      setTaskFormErrors({});

      const createdTask = response?.data?.data as ITask | undefined;
      if (createdTask && boardProject) {
        const targetListTask = createdTask.listTaskId ? listTaskById.get(String(createdTask.listTaskId)) : undefined;
        const mappedTask = buildTaskFromApi(
          createdTask,
          String(createdTask.projectId ?? boardProject.id),
          targetListTask?.status,
          targetListTask?.id,
        );

        setBoardTasks((prev) => sortTasks([...prev, mappedTask]));
      }

      toast.success(language === "vi" ? "Đã tạo task mới" : "New task created");
      void refreshTaskBoardQueries();
    },
    onError: (error) => {
      toast.error(extractApiErrorMessage(error, "Tạo task thất bại"));
    },
  });

  const openCreateTaskDialog = (status: TaskStatus) => {
    if (!canManageTasks) {
      return;
    }

    if (!boardProject) {
      return;
    }

    const listTask = listTasksByStatus.get(status);
    if (!listTask) {
      toast.error(language === "vi" ? "Không tìm thấy cột tương ứng trong project này" : "No matching column was found in this project");
      return;
    }

    setCreateTaskProjectId(String(boardProject.id));
    setCreateTaskListTaskId(String(listTask.id));
    setCreateTaskColumnLabel(statusMeta[status].label);
    setTaskForm((prev) => ({
      ...prev,
      projectId: String(boardProject.id),
      listTaskId: String(listTask.id),
    }));
    setIsCreateTaskDialogOpen(true);
  };

  const handleFieldChange = (field: keyof ICreateTask, value: string) => {
    setTaskForm((prev) => {
      const nextForm = {
        ...prev,
        [field]: value,
      };

      if (field === "dueDate" || field === "reminderDate") {
        setTaskFormErrors(validateTaskDates(nextForm.dueDate, nextForm.reminderDate, language));
      }

      return nextForm;
    });
  };

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!taskForm.projectId || !taskForm.listTaskId) {
      toast.error(language === "vi" ? "Thiếu project hoặc cột trạng thái" : "Project or status column is missing");
      return;
    }

    const dateErrors = validateTaskDates(taskForm.dueDate, taskForm.reminderDate, language);
    setTaskFormErrors(dateErrors);

    if (Object.keys(dateErrors).length > 0) {
      toast.error("Vui lòng kiểm tra lại ngày due date và reminder date.");
      return;
    }

    await createTaskMutation.mutateAsync({
      ...taskForm,
      projectId: taskForm.projectId,
      listTaskId: taskForm.listTaskId,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!canDragTasks) {
      return;
    }

    const { active, over } = event;

    if (!over) {
      return;
    }

    if (String(active.id) === String(over.id)) {
      return;
    }

    const draggedTask = paginatedTasks.find((task) => task.id === String(active.id));
    if (!draggedTask) {
      return;
    }

    const overId = String(over.id);
    const targetTask = boardTasks.find((task) => task.id === overId);
    const targetStatus = (statusOrder.includes(overId as TaskStatus)
      ? (overId as TaskStatus)
      : targetTask?.status) as TaskStatus | undefined;
    const targetListTask = targetStatus ? (listTasksByStatus.get(targetStatus) ?? undefined) : undefined;

    if (!targetListTask) {
      return;
    }

    const sourceStatus = draggedTask.status;
    const nextStatus = normalizeStatus(targetListTask.status);

    const previousTasks = [...boardTasks];
    const isStatusChange = sourceStatus !== nextStatus;

    if (!canManageTasks) {
      const nextBoardTasks = boardTasks.map((task) =>
        task.id === draggedTask.id
          ? {
            ...task,
            listTaskId: String(targetListTask.id),
            status: nextStatus,
            orderIndex: 0,
          }
          : task,
      );

      setBoardTasks(sortTasks(nextBoardTasks));

      void (async () => {
        try {
          await handleApi({
            url: `${apiName.tasks.updateStatus}/${draggedTask.id}`,
            method: "PATCH",
            params: { listTaskId: String(targetListTask.id) },
            withCredentials: true,
          });
          toast.success(language === "vi" ? "Đã cập nhật trạng thái task" : "Task status updated");
        } catch {
          setBoardTasks(previousTasks);
          toast.error(language === "vi" ? "Kéo thả thất bại, đã hoàn tác" : "Drag and drop failed and was reverted");
        }
      })();

      return;
    }

    const targetListTaskId = String(targetListTask.id);
    const sourceListTaskId = String(
      draggedTask.listTaskId ?? listTasksByStatus.get(sourceStatus)?.id ?? targetListTask.id,
    );

    if (isStatusChange) {
      const targetTasks = sortTasks(boardTasks.filter((task) => String(task.listTaskId ?? "") === targetListTaskId));
      const insertAt = targetTask
        ? Math.max(targetTasks.findIndex((task) => task.id === targetTask.id), 0)
        : targetTasks.length;

      const nextBoardTasks = boardTasks.map((task) => {
        if (task.id === draggedTask.id) {
          return {
            ...task,
            listTaskId: targetListTaskId,
            status: nextStatus,
            orderIndex: insertAt,
          };
        }

        return task;
      });

      setBoardTasks(sortTasks(nextBoardTasks));

      void (async () => {
        try {
          await handleApi({
            url: `${apiName.tasks.updateStatus}/${draggedTask.id}`,
            method: "PATCH",
            params: { listTaskId: targetListTaskId },
            withCredentials: true,
          });
          toast.success(language === "vi" ? "Đã cập nhật trạng thái task" : "Task status updated");
        } catch {
          setBoardTasks(previousTasks);
          toast.error(language === "vi" ? "Kéo thả thất bại, đã hoàn tác" : "Drag and drop failed and was reverted");
        }
      })();

      return;
    }

    const sourceTasks = sortTasks(boardTasks.filter((task) => String(task.listTaskId ?? "") === sourceListTaskId));
    const targetTasks =
      sourceListTaskId === targetListTaskId
        ? sourceTasks
        : sortTasks(boardTasks.filter((task) => String(task.listTaskId ?? "") === targetListTaskId));

    const sourceIndex = sourceTasks.findIndex((task) => task.id === draggedTask.id);
    const targetIndex = targetTask
      ? targetTasks.findIndex((task) => task.id === targetTask.id)
      : targetTasks.length;

    const nextSourceTasks = sourceTasks
      .filter((task) => task.id !== draggedTask.id)
      .map((task, index) => ({
        ...task,
        orderIndex: index,
      }));

    const nextTargetTasks =
      sourceListTaskId === targetListTaskId
        ? arrayMove(sourceTasks, sourceIndex, targetIndex).map((task, index) => ({
          ...task,
          listTaskId: targetListTaskId,
          orderIndex: index,
          status: nextStatus,
        }))
        : (() => {
          const targetTasksWithoutDragged = targetTasks.filter((task) => task.id !== draggedTask.id);
          const insertAt = targetIndex < 0 ? targetTasksWithoutDragged.length : targetIndex;
          const reordered = [...targetTasksWithoutDragged];
          reordered.splice(insertAt, 0, {
            ...draggedTask,
            listTaskId: targetListTaskId,
            status: nextStatus,
          });
          return reordered.map((task, index) => ({
            ...task,
            listTaskId: targetListTaskId,
            orderIndex: index,
            status: nextStatus,
          }));
        })();

    const nextBoardTasks = boardTasks.map((task) => {
      if (sourceListTaskId === targetListTaskId) {
        const reorderedTask = nextTargetTasks.find((item) => item.id === task.id);
        return reorderedTask ?? task;
      }

      if (task.id === draggedTask.id) {
        return {
          ...task,
          listTaskId: targetListTaskId,
          orderIndex: nextTargetTasks.find((item) => item.id === task.id)?.orderIndex,
          status: nextStatus,
        };
      }

      if (String(task.listTaskId ?? "") === sourceListTaskId) {
        return nextSourceTasks.find((item) => item.id === task.id) ?? task;
      }

      if (String(task.listTaskId ?? "") === targetListTaskId) {
        return nextTargetTasks.find((item) => item.id === task.id) ?? task;
      }

      return task;
    });

    setBoardTasks(sortTasks(nextBoardTasks));

    void (async () => {
      try {
        if (sourceListTaskId === targetListTaskId) {
          await saveTaskOrder(nextTargetTasks);
        } else {
          await Promise.all([saveTaskOrder(nextSourceTasks), saveTaskOrder(nextTargetTasks)]);
        }
        toast.success(language === "vi" ? "Đã lưu thứ tự task" : "Task order saved");
      } catch {
        setBoardTasks(previousTasks);
        toast.error(language === "vi" ? "Kéo thả thất bại, đã hoàn tác" : "Drag and drop failed and was reverted");
      }
    })();
  };

  const isBoardReady = Boolean(boardProject);
  const isTaskLoading = useMinVisibleLoading(isSearchingTasks, 900);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle>
          {selectedProjectId ? `${t("taskBoard.projectTasksTitle")}: ${selectedProject?.title || selectedProjectId}` : t("taskBoard.workspace")}
        </CardTitle>
        <CardDescription>
          {selectedProjectId
            ? t("taskBoard.projectTasksDescription")
            : t("taskBoard.selectProject")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("taskBoard.searchPlaceholder")}
              className="pl-9"
            />
            {isTaskLoading ? (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : null}
          </div>

          {!selectedProjectId ? (
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-full xl:w-[200px]">
                <SelectValue placeholder={t("taskBoard.filterProject")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("taskBoard.allProjects")}</SelectItem>
                {Object.values(projectMap).map((project) => (
                  <SelectItem key={project.id} value={String(project.id)}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as "all" | TaskStatus)}
          >
            <SelectTrigger className="w-full xl:w-[180px]">
              <SelectValue placeholder={t("taskBoard.filterStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("taskBoard.allStatuses")}</SelectItem>
              {statusOrder.map((status) => (
                <SelectItem key={status} value={status}>
                  {statusMeta[status].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <Grid2x2 className="h-4 w-4" />
              {t("taskBoard.viewTable")}
            </Button>
            <Button
              variant={viewMode === "kanban" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("kanban")}
            >
              <Kanban className="h-4 w-4" />
              {t("taskBoard.viewKanban")}
            </Button>
          </div>
        </div>



        {viewMode === "table" ? (
          isTaskLoading ? (
            <SprintTableLoading />
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("taskBoard.tableId")}</TableHead>
                    <TableHead>{t("taskBoard.tableTask")}</TableHead>
                    <TableHead>{t("taskBoard.tableProject")}</TableHead>
                    <TableHead>{t("taskBoard.tableStatus")}</TableHead>
                    <TableHead>{t("taskBoard.tablePriority")}</TableHead>
                    <TableHead>{t("taskBoard.tableAssignee")}</TableHead>
                    <TableHead>{t("taskBoard.tableDueDate")}</TableHead>
                    <TableHead>{t("taskBoard.tableChecklist")}</TableHead>
                    <TableHead className="text-right">{t("taskBoard.tableActions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.id}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{task.title}</p>
                          <div className="flex flex-wrap gap-1">
                            {task.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-[10px]">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{projectMap[String(task.projectId)]?.title ?? t("taskBoard.tableUnknownProject")}</TableCell>
                      <TableCell>
                        {canChangeTaskState ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className={cn("h-8 px-2", statusMeta[task.status].badgeClass)}>
                                {statusMeta[task.status].label}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {statusOrder.map((status) => (
                                <DropdownMenuItem
                                  key={status}
                                  onClick={() => handleChangeRowTaskStatus(task, status)}
                                  disabled={status === task.status || updateTaskStatusMutation.isPending}
                                >
                                  {statusMeta[status].label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Badge variant="outline" className={statusMeta[task.status].badgeClass}>
                            {statusMeta[task.status].label}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={priorityMeta[task.priority].badgeClass}>
                          {priorityMeta[task.priority].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={task.assigneeAvatar} alt={task.assignee} />
                            <AvatarFallback className="text-xs">{initials(task.assignee)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{task.assignee}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(task.dueDate, language)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {task.checklistDone}/{task.checklistTotal}
                          </p>
                          <p className="text-xs text-muted-foreground">{t("taskBoard.tableChecklist")}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedTask(task)}
                            title={t("taskBoard.updateTask")}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          {canManageTasks ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  disabled={deleteTaskMutation.isPending}
                                  title={t("taskBoard.deleteTask")}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t("taskBoard.deleteTaskConfirm")}</AlertDialogTitle>
                                  <AlertDialogDescription>{t("taskBoard.deleteTaskDescription")}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t("taskBoard.cancel")}</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteTaskMutation.mutate(task)}>
                                    {t("taskBoard.deleteTask")}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {paginatedTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                        {t("taskBoard.tableNoMatch")}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          )
        ) : isBoardReady ? (
          isTaskLoading ? (
            <SprintBoardLoading />
          ) : (
            <DndContext sensors={sensor} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
              <div className="pb-2">
                <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 2xl:grid-cols-4">
                  {statusOrder.map((status) => {
                    const columnTasks = groupedTasks[status];

                    return (
                      <TaskBoardColumn
                        key={status}
                        status={status}
                        title={statusMeta[status].label}
                        tasks={columnTasks}
                        onAddTask={() => openCreateTaskDialog(status)}
                        onOpenTaskDetail={setSelectedTask}
                        canManageTasks={canManageTasks}
                        canDragTasks={canDragTasks}
                        statusMeta={statusMeta}
                        priorityMeta={priorityMeta}
                        language={language}
                        t={t}
                      />
                    );
                  })}
                </div>
              </div>
            </DndContext>
          )
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t("taskBoard.selectProject")}
          </div>
        )}
      </CardContent>

      {viewMode === "table" ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-sm dark:bg-card/70">
          <span className="text-muted-foreground">
            {language === "vi"
              ? `Hiển thị ${totalTasks === 0 ? 0 : pageStart + 1}-${pageEnd} / ${totalTasks} task`
              : `Showing ${totalTasks === 0 ? 0 : pageStart + 1}-${pageEnd} of ${totalTasks} tasks`}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger className="h-8 w-[110px]">
                <SelectValue placeholder={language === "vi" ? "Số lượng" : "Rows"} />
              </SelectTrigger>
              <SelectContent>
                {TASK_PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {language === "vi" ? `${size}/trang` : `${size}/page`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={safeCurrentPage === 1}>
              {language === "vi" ? "Đầu" : "First"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
            >
              {language === "vi" ? "Trước" : "Prev"}
            </Button>
            <span className="min-w-20 text-center text-xs text-muted-foreground">
              {language === "vi" ? `Trang ${safeCurrentPage}/${totalPages}` : `Page ${safeCurrentPage}/${totalPages}`}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage >= totalPages || !(searchedTaskPage?.hasNext ?? false)}
            >
              {language === "vi" ? "Sau" : "Next"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
            >
              {language === "vi" ? "Cuối" : "Last"}
            </Button>
          </div>
        </div>
      ) : null}

      {canManageTasks ? (
        <CreateTaskDialog
          open={isCreateTaskDialogOpen}
          onOpenChange={setIsCreateTaskDialogOpen}
          form={taskForm}
          onFieldChange={handleFieldChange}
          onSubmit={handleCreateTask}
          isSubmitting={createTaskMutation.isPending}
          project={boardProject}
          columnLabel={createTaskColumnLabel}
          dateErrors={taskFormErrors}
        />
      ) : null}

      <TaskDetailDialog
        task={selectedTask}
        projectId={String(boardProject?.id ?? selectedTask?.projectId ?? "")}
        readOnly={!canManageTasks}
        canEditTask={canManageTasks}
        canComment={canManageTasks}
        canAdvanceStatus={canManageTasks}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTask(null);
          }
        }}
        onTaskUpdated={handleTaskUpdated}
      />
    </Card>
  );
};

export default TaskList;
