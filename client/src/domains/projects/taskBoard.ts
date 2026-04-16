export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type ProjectStatus = "planning" | "on_track" | "at_risk" | "completed";

export type Task = {
  id: string;
  projectId: string | number;
  listTaskId?: string;
  orderIndex?: number;
  assignedAccountId?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  assigneeAvatar?: string;
  dueDate: string;
  reminderDate?: string;
  checklistDone: number;
  checklistTotal: number;
  comments: number;
  attachments: number;
  tags: string[];
};

export type NewTaskForm = {
  projectId: string;
  title: string;
  description: string;
  assignedAccountId: string;
  listTaskId: string;
  reminderDate: string;
  assignee: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string;
};

export type NewProjectForm = {
  name: string;
  summary: string;
  owner: string;
  startDate: string;
  dueDate: string;
  status: ProjectStatus;
};

export const statusMeta: Record<
  TaskStatus,
  { label: string; columnClass: string; badgeClass: string }
> = {
  backlog: {
    label: "Backlog",
    columnClass: "border-slate-300 bg-slate-50/80",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
  todo: {
    label: "To do",
    columnClass: "border-cyan-300 bg-cyan-50/80",
    badgeClass: "bg-cyan-100 text-cyan-700 border-cyan-200",
  },
  in_progress: {
    label: "In progress",
    columnClass: "border-amber-300 bg-amber-50/80",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
  },
  review: {
    label: "Review",
    columnClass: "border-violet-300 bg-violet-50/80",
    badgeClass: "bg-violet-100 text-violet-700 border-violet-200",
  },
  done: {
    label: "Done",
    columnClass: "border-emerald-300 bg-emerald-50/80",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
};

export const priorityMeta: Record<
  TaskPriority,
  { label: string; badgeClass: string }
> = {
  low: {
    label: "Low",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
  medium: {
    label: "Medium",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
  },
  high: {
    label: "High",
    badgeClass: "bg-orange-100 text-orange-700 border-orange-200",
  },
  critical: {
    label: "Critical",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
  },
};

export const projectStatusMeta: Record<
  ProjectStatus,
  { label: string; badgeClass: string }
> = {
  planning: {
    label: "Planning",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
  on_track: {
    label: "On track",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  at_risk: {
    label: "At risk",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
  },
};

export const statusOrder: TaskStatus[] = ["todo", "in_progress", "review", "done"];

export const defaultNewTask: NewTaskForm = {
  projectId: "",
  title: "",
  description: "",
  assignedAccountId: "",
  listTaskId: "",
  reminderDate: "",
  assignee: "",
  dueDate: "",
  status: "todo",
  priority: "medium",
  tags: "",
};

export const formatDate = (date: string) => {
  if (!date) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("");

export const calcTaskCompletion = (task: Task) => {
  if (task.checklistTotal <= 0) {
    return task.status === "done" ? 100 : 0;
  }

  return Math.round((task.checklistDone / task.checklistTotal) * 100);
};
