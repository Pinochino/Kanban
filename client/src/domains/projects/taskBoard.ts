import type { Language } from "@/i18n/messages";

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

type LocalizedMeta = {
  label: string;
  columnClass: string;
  badgeClass: string;
};

const statusMetaByLanguage: Record<Language, Record<TaskStatus, LocalizedMeta>> = {
  vi: {
    backlog: {
      label: "Tồn đọng",
      columnClass: "border-border/80 bg-muted/30 dark:border-border/70 dark:bg-card/60",
      badgeClass: "bg-muted text-muted-foreground border-border/70 dark:bg-muted/60 dark:text-muted-foreground",
    },
    todo: {
      label: "Cần làm",
      columnClass: "border-cyan-200 bg-cyan-50/60 dark:border-cyan-900/40 dark:bg-cyan-950/20",
      badgeClass: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-200 dark:border-cyan-900/60",
    },
    in_progress: {
      label: "Đang làm",
      columnClass: "border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20",
      badgeClass: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-900/60",
    },
    review: {
      label: "Chờ duyệt",
      columnClass: "border-violet-200 bg-violet-50/60 dark:border-violet-900/40 dark:bg-violet-950/20",
      badgeClass: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-200 dark:border-violet-900/60",
    },
    done: {
      label: "Hoàn thành",
      columnClass: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20",
      badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-900/60",
    },
  },
  en: {
    backlog: {
      label: "Backlog",
      columnClass: "border-border/80 bg-muted/30 dark:border-border/70 dark:bg-card/60",
      badgeClass: "bg-muted text-muted-foreground border-border/70 dark:bg-muted/60 dark:text-muted-foreground",
    },
    todo: {
      label: "To do",
      columnClass: "border-cyan-200 bg-cyan-50/60 dark:border-cyan-900/40 dark:bg-cyan-950/20",
      badgeClass: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-200 dark:border-cyan-900/60",
    },
    in_progress: {
      label: "In progress",
      columnClass: "border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20",
      badgeClass: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-900/60",
    },
    review: {
      label: "Review",
      columnClass: "border-violet-200 bg-violet-50/60 dark:border-violet-900/40 dark:bg-violet-950/20",
      badgeClass: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-200 dark:border-violet-900/60",
    },
    done: {
      label: "Done",
      columnClass: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20",
      badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-900/60",
    },
  },
};

const priorityMetaByLanguage: Record<Language, Record<TaskPriority, { label: string; badgeClass: string }>> = {
  vi: {
    low: {
      label: "Thấp",
      badgeClass: "bg-muted text-muted-foreground border-border/70 dark:bg-muted/60 dark:text-muted-foreground",
    },
    medium: {
      label: "Trung bình",
      badgeClass: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-900/60",
    },
    high: {
      label: "Cao",
      badgeClass: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-200 dark:border-orange-900/60",
    },
    critical: {
      label: "Khẩn cấp",
      badgeClass: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-900/60",
    },
  },
  en: {
    low: {
      label: "Low",
      badgeClass: "bg-muted text-muted-foreground border-border/70 dark:bg-muted/60 dark:text-muted-foreground",
    },
    medium: {
      label: "Medium",
      badgeClass: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-900/60",
    },
    high: {
      label: "High",
      badgeClass: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-200 dark:border-orange-900/60",
    },
    critical: {
      label: "Critical",
      badgeClass: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-900/60",
    },
  },
};

const projectStatusMetaByLanguage: Record<Language, Record<ProjectStatus, { label: string; badgeClass: string }>> = {
  vi: {
    planning: {
      label: "Lập kế hoạch",
      badgeClass: "bg-muted text-muted-foreground border-border/70 dark:bg-muted/60 dark:text-muted-foreground",
    },
    on_track: {
      label: "Đúng tiến độ",
      badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-900/60",
    },
    at_risk: {
      label: "Có rủi ro",
      badgeClass: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-900/60",
    },
    completed: {
      label: "Hoàn thành",
      badgeClass: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-900/60",
    },
  },
  en: {
    planning: {
      label: "Planning",
      badgeClass: "bg-muted text-muted-foreground border-border/70 dark:bg-muted/60 dark:text-muted-foreground",
    },
    on_track: {
      label: "On track",
      badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-900/60",
    },
    at_risk: {
      label: "At risk",
      badgeClass: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-900/60",
    },
    completed: {
      label: "Completed",
      badgeClass: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-900/60",
    },
  },
};

export const getStatusMeta = (language: Language = "vi") => statusMetaByLanguage[language];

export const getPriorityMeta = (language: Language = "vi") => priorityMetaByLanguage[language];

export const getProjectStatusMeta = (language: Language = "vi") => projectStatusMetaByLanguage[language];

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

export const formatDate = (date: string, language: Language = "vi") => {
  if (!date) {
    return language === "en" ? "No due date" : "Chưa có hạn";
  }

  return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "vi-VN", {
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
