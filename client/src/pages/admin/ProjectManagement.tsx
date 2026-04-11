import React, { FormEvent, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Eye,
  Grid2x2,
  Kanban,
  LayoutList,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Sparkles,
  Target,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";
type TaskPriority = "low" | "medium" | "high" | "critical";
type ProjectStatus = "planning" | "on_track" | "at_risk" | "completed";

type Project = {
  id: string;
  name: string;
  summary: string;
  owner: string;
  startDate: string;
  dueDate: string;
  status: ProjectStatus;
};

type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  assigneeAvatar?: string;
  dueDate: string;
  checklistDone: number;
  checklistTotal: number;
  comments: number;
  attachments: number;
  tags: string[];
};

type NewTaskForm = {
  projectId: string;
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string;
};

type NewProjectForm = {
  name: string;
  summary: string;
  owner: string;
  startDate: string;
  dueDate: string;
  status: ProjectStatus;
};

const statusMeta: Record<TaskStatus, { label: string; columnClass: string; badgeClass: string }> = {
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

const priorityMeta: Record<TaskPriority, { label: string; badgeClass: string }> = {
  low: { label: "Low", badgeClass: "bg-slate-100 text-slate-700 border-slate-200" },
  medium: { label: "Medium", badgeClass: "bg-blue-100 text-blue-700 border-blue-200" },
  high: { label: "High", badgeClass: "bg-orange-100 text-orange-700 border-orange-200" },
  critical: { label: "Critical", badgeClass: "bg-red-100 text-red-700 border-red-200" },
};

const projectStatusMeta: Record<ProjectStatus, { label: string; badgeClass: string }> = {
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

const statusOrder: TaskStatus[] = ["backlog", "todo", "in_progress", "review", "done"];

const initialProjects: Project[] = [
  {
    id: "PRJ-101",
    name: "Workspace Performance",
    summary: "Optimize board loading speed and rendering scalability for large teams.",
    owner: "Daniel Tran",
    startDate: "2026-03-20",
    dueDate: "2026-04-22",
    status: "on_track",
  },
  {
    id: "PRJ-102",
    name: "Enterprise Access Control",
    summary: "Finalize role permissions and secure admin workflows before enterprise rollout.",
    owner: "Hoang Vu",
    startDate: "2026-03-12",
    dueDate: "2026-04-18",
    status: "at_risk",
  },
  {
    id: "PRJ-103",
    name: "Team Productivity Toolkit",
    summary: "Ship planning templates, bulk operations, and notification improvements.",
    owner: "Linh Nguyen",
    startDate: "2026-03-28",
    dueDate: "2026-04-28",
    status: "planning",
  },
];

const initialTasks: Task[] = [
  {
    id: "TASK-101",
    projectId: "PRJ-101",
    title: "Improve board load performance",
    description:
      "Optimize first paint for board screen by reducing redundant API calls and improving memoization around list rendering.",
    status: "in_progress",
    priority: "high",
    assignee: "Daniel Tran",
    dueDate: "2026-04-12",
    checklistDone: 5,
    checklistTotal: 9,
    comments: 8,
    attachments: 2,
    tags: ["Frontend", "Performance"],
  },
  {
    id: "TASK-102",
    projectId: "PRJ-103",
    title: "Design sprint planning workflow",
    description:
      "Create reusable templates and status conventions for sprint planning sessions across product squads.",
    status: "backlog",
    priority: "medium",
    assignee: "Linh Nguyen",
    dueDate: "2026-04-20",
    checklistDone: 1,
    checklistTotal: 5,
    comments: 3,
    attachments: 1,
    tags: ["Process", "Planning"],
  },
  {
    id: "TASK-103",
    projectId: "PRJ-103",
    title: "Set up notification preferences",
    description:
      "Allow users to customize mention alerts, due date reminders, and digest frequency on project boards.",
    status: "todo",
    priority: "medium",
    assignee: "Bao Chau",
    dueDate: "2026-04-15",
    checklistDone: 2,
    checklistTotal: 6,
    comments: 4,
    attachments: 0,
    tags: ["UX", "Settings"],
  },
  {
    id: "TASK-104",
    projectId: "PRJ-102",
    title: "Review permission matrix",
    description:
      "Audit role permissions for admin, manager, and member actions before releasing enterprise workspace controls.",
    status: "review",
    priority: "critical",
    assignee: "Hoang Vu",
    dueDate: "2026-04-10",
    checklistDone: 7,
    checklistTotal: 8,
    comments: 12,
    attachments: 4,
    tags: ["Security", "Admin"],
  },
  {
    id: "TASK-105",
    projectId: "PRJ-101",
    title: "Document board analytics events",
    description:
      "Map all board interactions to tracking events and provide examples for product analytics dashboards.",
    status: "done",
    priority: "low",
    assignee: "Khanh Le",
    dueDate: "2026-04-07",
    checklistDone: 5,
    checklistTotal: 5,
    comments: 2,
    attachments: 1,
    tags: ["Analytics", "Docs"],
  },
  {
    id: "TASK-106",
    projectId: "PRJ-103",
    title: "Implement bulk move in Kanban",
    description:
      "Support selecting multiple tasks and moving them between columns in one action to speed up triage sessions.",
    status: "todo",
    priority: "high",
    assignee: "Thanh Pham",
    dueDate: "2026-04-18",
    checklistDone: 0,
    checklistTotal: 4,
    comments: 6,
    attachments: 2,
    tags: ["Kanban", "Productivity"],
  },
];

const defaultNewProject: NewProjectForm = {
  name: "",
  summary: "",
  owner: "",
  startDate: "",
  dueDate: "",
  status: "planning",
};

const defaultNewTask: NewTaskForm = {
  projectId: "",
  title: "",
  description: "",
  assignee: "",
  dueDate: "",
  status: "todo",
  priority: "medium",
  tags: "",
};

const formatDate = (date: string) => {
  if (!date) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("");

const calcTaskCompletion = (task: Task) => {
  if (task.checklistTotal <= 0) {
    return task.status === "done" ? 100 : 0;
  }

  return Math.round((task.checklistDone / task.checklistTotal) * 100);
};

const ProjectCreateDialog = ({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: NewProjectForm;
  onFormChange: (field: keyof NewProjectForm, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form className="space-y-4" onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Create project</DialogTitle>
            <DialogDescription>
              Add a new project with owner, timeline, and status to track project-level progress.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                value={form.name}
                onChange={(event) => onFormChange("name", event.target.value)}
                placeholder="Example: Mobile Release v2"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="project-summary">Summary</Label>
              <Textarea
                id="project-summary"
                value={form.summary}
                onChange={(event) => onFormChange("summary", event.target.value)}
                placeholder="Describe objective, scope, and expected outcome..."
                className="min-h-[100px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-owner">Owner</Label>
              <Input
                id="project-owner"
                value={form.owner}
                onChange={(event) => onFormChange("owner", event.target.value)}
                placeholder="Project owner"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => onFormChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose status" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(projectStatusMeta) as ProjectStatus[]).map((status) => (
                    <SelectItem key={status} value={status}>
                      {projectStatusMeta[status].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-start-date">Start date</Label>
              <Input
                id="project-start-date"
                type="date"
                value={form.startDate}
                onChange={(event) => onFormChange("startDate", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-due-date">Due date</Label>
              <Input
                id="project-due-date"
                type="date"
                value={form.dueDate}
                onChange={(event) => onFormChange("dueDate", event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Create project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const TaskCreateDialog = ({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  projects,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: NewTaskForm;
  onFormChange: (field: keyof NewTaskForm, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  projects: Project[];
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form className="space-y-4" onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Create task</DialogTitle>
            <DialogDescription>
              Add a new card into a specific project to keep task and project progress synchronized.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Project</Label>
              <Select value={form.projectId} onValueChange={(value) => onFormChange("projectId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={form.title}
                onChange={(event) => onFormChange("title", event.target.value)}
                placeholder="Example: Build drag-and-drop for card sorting"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={form.description}
                onChange={(event) => onFormChange("description", event.target.value)}
                placeholder="Describe acceptance criteria, context, and blockers..."
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-assignee">Assignee</Label>
              <Input
                id="task-assignee"
                value={form.assignee}
                onChange={(event) => onFormChange("assignee", event.target.value)}
                placeholder="Assignee name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-due-date">Due date</Label>
              <Input
                id="task-due-date"
                type="date"
                value={form.dueDate}
                onChange={(event) => onFormChange("dueDate", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => onFormChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOrder.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusMeta[status].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(value) => onFormChange("priority", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose priority" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(priorityMeta) as TaskPriority[]).map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priorityMeta[priority].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="task-tags">Tags</Label>
              <Input
                id="task-tags"
                value={form.tags}
                onChange={(event) => onFormChange("tags", event.target.value)}
                placeholder="Kanban, UI, Sprint 12"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Create task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const TaskDetailDialog = ({
  task,
  projectName,
  onOpenChange,
}: {
  task: Task | null;
  projectName: string;
  onOpenChange: (open: boolean) => void;
}) => {
  return (
    <Dialog open={Boolean(task)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {task ? (
          <div className="space-y-5">
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={cn("capitalize", statusMeta[task.status].badgeClass)}>
                  {statusMeta[task.status].label}
                </Badge>
                <Badge variant="outline" className={cn("capitalize", priorityMeta[task.priority].badgeClass)}>
                  {priorityMeta[task.priority].label}
                </Badge>
                <Badge variant="outline">{task.id}</Badge>
                <Badge variant="secondary">{projectName}</Badge>
              </div>
              <DialogTitle className="pt-2 text-xl">{task.title}</DialogTitle>
              <DialogDescription>{task.description}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Assignee</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={task.assigneeAvatar} alt={task.assignee} />
                    <AvatarFallback>{initials(task.assignee)}</AvatarFallback>
                  </Avatar>
                  <p className="font-medium">{task.assignee}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Due date</p>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  {formatDate(task.dueDate)}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Checklist</p>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {task.checklistDone}/{task.checklistTotal} complete
                  </p>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${calcTaskCompletion(task)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Resources</p>
                <div className="flex gap-4 text-sm font-medium">
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    {task.comments} comments
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    {task.attachments} files
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tags</p>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

const ProjectManagement = () => {
  const [viewMode, setViewMode] = useState<"table" | "kanban">("kanban");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(projects[0]?.id ?? null);
  const [newTask, setNewTask] = useState<NewTaskForm>({
    ...defaultNewTask,
    projectId: projects[0]?.id ?? "",
  });
  const [newProject, setNewProject] = useState<NewProjectForm>(defaultNewProject);

  const projectMap = useMemo(() => {
    return projects.reduce(
      (acc, project) => {
        acc[project.id] = project;
        return acc;
      },
      {} as Record<string, Project>,
    );
  }, [projects]);

  const projectStats = useMemo(() => {
    return projects.map((project) => {
      const projectTasks = tasks.filter((task) => task.projectId === project.id);
      const doneTasks = projectTasks.filter((task) => task.status === "done").length;
      const totalChecklist = projectTasks.reduce((sum, task) => sum + task.checklistTotal, 0);
      const doneChecklist = projectTasks.reduce((sum, task) => sum + task.checklistDone, 0);
      const progress =
        totalChecklist > 0
          ? Math.round((doneChecklist / totalChecklist) * 100)
          : projectTasks.length > 0
            ? Math.round((doneTasks / projectTasks.length) * 100)
            : 0;

      return {
        project,
        projectTasks,
        doneTasks,
        progress,
      };
    });
  }, [projects, tasks]);

  const filteredTasks = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const projectName = projectMap[task.projectId]?.name ?? "";
      const matchesSearch =
        !keyword ||
        task.title.toLowerCase().includes(keyword) ||
        task.id.toLowerCase().includes(keyword) ||
        task.description.toLowerCase().includes(keyword) ||
        task.assignee.toLowerCase().includes(keyword) ||
        projectName.toLowerCase().includes(keyword);

      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesProject = projectFilter === "all" || task.projectId === projectFilter;

      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [projectFilter, projectMap, search, statusFilter, tasks]);

  const groupedTasks = useMemo(() => {
    return statusOrder.reduce(
      (acc, status) => {
        acc[status] = filteredTasks.filter((task) => task.status === status);
        return acc;
      },
      {
        backlog: [],
        todo: [],
        in_progress: [],
        review: [],
        done: [],
      } as Record<TaskStatus, Task[]>,
    );
  }, [filteredTasks]);

  const handleTaskFormChange = (field: keyof NewTaskForm, value: string) => {
    setNewTask((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProjectFormChange = (field: keyof NewProjectForm, value: string) => {
    setNewProject((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = newProject.name.trim();
    const trimmedOwner = newProject.owner.trim();
    const trimmedSummary = newProject.summary.trim();

    if (!trimmedName || !trimmedOwner || !trimmedSummary) {
      return;
    }

    const numericIds = projects
      .map((project) => Number(project.id.replace("PRJ-", "")))
      .filter((value) => Number.isFinite(value));
    const nextId = Math.max(100, ...numericIds) + 1;

    const createdProject: Project = {
      id: `PRJ-${nextId}`,
      name: trimmedName,
      summary: trimmedSummary,
      owner: trimmedOwner,
      startDate: newProject.startDate,
      dueDate: newProject.dueDate,
      status: newProject.status,
    };

    setProjects((prev) => [createdProject, ...prev]);
    setNewProject(defaultNewProject);
    setExpandedProjectId(createdProject.id);
    setProjectFilter(createdProject.id);
    setNewTask((prev) => ({ ...prev, projectId: createdProject.id }));
    setIsCreateProjectDialogOpen(false);
  };

  const handleCreateTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = newTask.title.trim();
    const trimmedProjectId = newTask.projectId.trim();
    if (!trimmedTitle || !trimmedProjectId) {
      return;
    }

    const trimmedAssignee = newTask.assignee.trim() || "Unassigned";
    const tags = newTask.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const numericIds = tasks
      .map((task) => Number(task.id.replace("TASK-", "")))
      .filter((value) => Number.isFinite(value));
    const nextId = Math.max(100, ...numericIds) + 1;

    const createdTask: Task = {
      id: `TASK-${String(nextId).padStart(3, "0")}`,
      projectId: trimmedProjectId,
      title: trimmedTitle,
      description: newTask.description.trim() || "No description provided.",
      status: newTask.status,
      priority: newTask.priority,
      assignee: trimmedAssignee,
      dueDate: newTask.dueDate,
      checklistDone: 0,
      checklistTotal: 0,
      comments: 0,
      attachments: 0,
      tags: tags.length > 0 ? tags : ["General"],
    };

    setTasks((prev) => [createdTask, ...prev]);
    setExpandedProjectId(createdTask.projectId);
    setProjectFilter(createdTask.projectId);
    setNewTask({ ...defaultNewTask, projectId: createdTask.projectId });
    setIsCreateTaskDialogOpen(false);
    setSelectedTask(createdTask);
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white shadow-xl">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-sm text-slate-200">
              <Sparkles className="h-4 w-4" />
              Project control center
            </p>
            <h1 className="text-2xl font-semibold md:text-3xl">Project Management</h1>
            <p className="max-w-2xl text-sm text-slate-200">
              Create projects, manage tasks inside each project, and monitor project progress in one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Dialog open={isCreateProjectDialogOpen} onOpenChange={setIsCreateProjectDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100">
                  <Plus className="h-4 w-4" />
                  Create project
                </Button>
              </DialogTrigger>
            </Dialog>

            <Dialog open={isCreateTaskDialogOpen} onOpenChange={setIsCreateTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary" className="bg-slate-700 text-white hover:bg-slate-600">
                  <Plus className="h-4 w-4" />
                  Create task
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Projects overview</CardTitle>
          <CardDescription>
            View project details, progress, and all tasks within each project directly in one management board.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectStats.map(({ project, projectTasks, doneTasks, progress }) => {
                  const isExpanded = expandedProjectId === project.id;

                  return (
                    <React.Fragment key={project.id}>
                      <TableRow>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold">{project.name}</p>
                            <p className="text-xs text-muted-foreground">{project.summary}</p>
                          </div>
                        </TableCell>
                        <TableCell>{project.owner}</TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <p>{formatDate(project.startDate)}</p>
                            <p className="text-muted-foreground">to {formatDate(project.dueDate)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {doneTasks}/{projectTasks.length} done
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5">
                            <p className="text-sm font-medium">{progress}%</p>
                            <div className="h-2 rounded-full bg-muted">
                              <div className="h-2 rounded-full bg-primary" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={projectStatusMeta[project.status].badgeClass}>
                            {projectStatusMeta[project.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-4 w-4" />
                                Hide
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4" />
                                Show tasks
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {isExpanded ? (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/20">
                            {projectTasks.length > 0 ? (
                              <div className="space-y-2 p-2">
                                {projectTasks.map((task) => (
                                  <div
                                    key={task.id}
                                    className="flex flex-col gap-3 rounded-md border bg-background p-3 md:flex-row md:items-center md:justify-between"
                                  >
                                    <div className="space-y-1">
                                      <p className="font-medium">{task.title}</p>
                                      <p className="text-xs text-muted-foreground">{task.id}</p>
                                      <div className="flex flex-wrap gap-1">
                                        {task.tags.map((tag) => (
                                          <Badge key={tag} variant="secondary" className="text-[10px]">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge variant="outline" className={statusMeta[task.status].badgeClass}>
                                        {statusMeta[task.status].label}
                                      </Badge>
                                      <Badge variant="outline" className={priorityMeta[task.priority].badgeClass}>
                                        {priorityMeta[task.priority].label}
                                      </Badge>
                                      <Badge variant="outline">{calcTaskCompletion(task)}%</Badge>
                                      <Button variant="outline" size="sm" onClick={() => setSelectedTask(task)}>
                                        <Eye className="h-4 w-4" />
                                        View
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-4 text-center text-sm text-muted-foreground">
                                This project has no task yet.
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Tasks board</CardTitle>
          <CardDescription>
            Search, filter by project, and switch between data table and Kanban view to operate daily tasks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by task name, project, ID, assignee, or description..."
                className="pl-9"
              />
            </div>

            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-full xl:w-[200px]">
                <SelectValue placeholder="Filter project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | TaskStatus)}>
              <SelectTrigger className="w-full xl:w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
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
                Table
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("kanban")}
              >
                <Kanban className="h-4 w-4" />
                Kanban
              </Button>
            </div>
          </div>

          {viewMode === "table" ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Due date</TableHead>
                    <TableHead>Checklist</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.id}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{task.title}</p>
                          <div className="flex flex-wrap gap-1">
                            {task.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-[10px]">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{projectMap[task.projectId]?.name ?? "Unknown project"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusMeta[task.status].badgeClass}>
                          {statusMeta[task.status].label}
                        </Badge>
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
                      <TableCell>{formatDate(task.dueDate)}</TableCell>
                      <TableCell>
                        {task.checklistDone}/{task.checklistTotal}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedTask(task)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View detail
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setNewTask((prev) => ({
                                  ...prev,
                                  projectId: task.projectId,
                                  status: task.status,
                                }));
                                setIsCreateTaskDialogOpen(true);
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Create new task
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                        No tasks matched your filters.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="overflow-x-auto pb-2">
              <div className="flex min-w-max items-start gap-4">
                {statusOrder.map((status) => (
                  <Card
                    key={status}
                    className={cn(
                      "w-[320px] border-2 shadow-sm transition-all duration-200",
                      statusMeta[status].columnClass,
                    )}
                  >
                    <CardHeader className="space-y-3 pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{statusMeta[status].label}</CardTitle>
                        <Badge variant="secondary">{groupedTasks[status].length}</Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          setNewTask((prev) => ({
                            ...prev,
                            status,
                            projectId:
                              projectFilter !== "all"
                                ? projectFilter
                                : projects[0]?.id ?? prev.projectId,
                          }));
                          setIsCreateTaskDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Add task in {statusMeta[status].label}
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {groupedTasks[status].map((task) => (
                        <Card
                          key={task.id}
                          className="cursor-pointer border bg-white/95 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                          onClick={() => setSelectedTask(task)}
                        >
                          <CardContent className="space-y-3 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <p className="line-clamp-2 font-medium">{task.title}</p>
                                <p className="text-xs text-muted-foreground">{task.id}</p>
                              </div>
                              <Badge variant="outline" className={priorityMeta[task.priority].badgeClass}>
                                {priorityMeta[task.priority].label}
                              </Badge>
                            </div>

                            <Badge variant="secondary" className="w-fit">
                              <Target className="h-3.5 w-3.5" />
                              {projectMap[task.projectId]?.name ?? "Unknown project"}
                            </Badge>

                            <div className="flex flex-wrap gap-1">
                              {task.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-[10px]">
                                  {tag}
                                </Badge>
                              ))}
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <LayoutList className="h-3.5 w-3.5" />
                                  Checklist
                                </span>
                                <span>
                                  {task.checklistDone}/{task.checklistTotal}
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-muted">
                                <div
                                  className="h-1.5 rounded-full bg-primary"
                                  style={{
                                    width: `${calcTaskCompletion(task)}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Clock3 className="h-3.5 w-3.5" />
                                {formatDate(task.dueDate)}
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
                                <span className="text-xs font-medium">{task.assignee}</span>
                              </div>

                              {task.status === "done" ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              ) : null}
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {groupedTasks[status].length === 0 ? (
                        <div className="rounded-md border border-dashed bg-white/70 p-4 text-center text-sm text-muted-foreground">
                          No tasks in this column.
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ProjectCreateDialog
        open={isCreateProjectDialogOpen}
        onOpenChange={setIsCreateProjectDialogOpen}
        form={newProject}
        onFormChange={handleProjectFormChange}
        onSubmit={handleCreateProject}
      />

      <TaskCreateDialog
        open={isCreateTaskDialogOpen}
        onOpenChange={setIsCreateTaskDialogOpen}
        form={newTask}
        onFormChange={handleTaskFormChange}
        onSubmit={handleCreateTask}
        projects={projects}
      />

      <TaskDetailDialog
        task={selectedTask}
        projectName={selectedTask ? projectMap[selectedTask.projectId]?.name ?? "Unknown project" : ""}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      />
    </div>
  );
};

export default ProjectManagement;
