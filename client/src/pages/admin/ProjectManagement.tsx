import React, { FormEvent, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
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
} from "lucide-react";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";
type TaskPriority = "low" | "medium" | "high" | "critical";

type Task = {
  id: string;
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
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string;
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

const statusOrder: TaskStatus[] = ["backlog", "todo", "in_progress", "review", "done"];

const initialTasks: Task[] = [
  {
    id: "TASK-101",
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

const defaultNewTask: NewTaskForm = {
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

const TaskCreateDialog = ({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: NewTaskForm;
  onFormChange: (field: keyof NewTaskForm, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form className="space-y-4" onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Create task</DialogTitle>
            <DialogDescription>
              Add a new card into your board. You can refine details later in the task detail modal.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
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
  onOpenChange,
}: {
  task: Task | null;
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
                        width: `${
                          task.checklistTotal > 0
                            ? (task.checklistDone / task.checklistTotal) * 100
                            : 0
                        }%`,
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
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<NewTaskForm>(defaultNewTask);

  const filteredTasks = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !keyword ||
        task.title.toLowerCase().includes(keyword) ||
        task.id.toLowerCase().includes(keyword) ||
        task.description.toLowerCase().includes(keyword) ||
        task.assignee.toLowerCase().includes(keyword);

      const matchesStatus = statusFilter === "all" || task.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, tasks]);

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

  const handleFormChange = (field: keyof NewTaskForm, value: string) => {
    setNewTask((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = newTask.title.trim();
    if (!trimmedTitle) {
      return;
    }

    const trimmedAssignee = newTask.assignee.trim() || "Unassigned";
    const tags = newTask.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const createdTask: Task = {
      id: `TASK-${String(tasks.length + 101).padStart(3, "0")}`,
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
    setNewTask(defaultNewTask);
    setIsCreateDialogOpen(false);
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
              Organize all project tasks with a Trello-style board, switch between data table and Kanban view,
              and manage task lifecycle in one place.
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100">
                <Plus className="h-4 w-4" />
                Create task
              </Button>
            </DialogTrigger>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Tasks overview</CardTitle>
          <CardDescription>
            Search, filter, and switch layouts to inspect your board from multiple perspectives.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by task name, ID, assignee, or description..."
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | TaskStatus)}>
              <SelectTrigger className="w-full lg:w-[180px]">
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
                            <DropdownMenuItem onClick={() => setIsCreateDialogOpen(true)}>
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
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
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
                          setNewTask((prev) => ({ ...prev, status }));
                          setIsCreateDialogOpen(true);
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
                                    width: `${
                                      task.checklistTotal > 0
                                        ? (task.checklistDone / task.checklistTotal) * 100
                                        : 0
                                    }%`,
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

      <TaskCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        form={newTask}
        onFormChange={handleFormChange}
        onSubmit={handleCreateTask}
      />

      <TaskDetailDialog task={selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)} />
    </div>
  );
};

export default ProjectManagement;
