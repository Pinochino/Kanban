import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DropdownMenu,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  calcTaskCompletion,
  formatDate,
  initials,
  priorityMeta,
  statusMeta,
  statusOrder,
  Task,
  TaskStatus,
} from "@/pages/admin/ProjectManagement";
import { IProject } from "@/types/ProjectInterface";
import { AvatarImage } from "@radix-ui/react-avatar";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import {
  CheckCircle2,
  Clock3,
  Grid2x2,
  Kanban,
  LayoutList,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Target,
} from "lucide-react";
import React, { useMemo, useState } from "react";

const TaskList = ({
  projectList,
  selectedProjectId,
  tasks,
  onCreateTask,
}: {
  projectList: IProject[];
  selectedProjectId?: string | number | null;
  tasks: Task[];
  onCreateTask?: () => void;
}) => {
  const [search, setSearch] = useState<string>("");
  const [viewMode, setViewMode] = useState<"table" | "kanban">("kanban");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

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

  const selectedProject = selectedProjectId
    ? projectMap[String(selectedProjectId)]
    : null;

  const filteredTasks = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const effectiveProjectFilter = selectedProjectId
      ? String(selectedProjectId)
      : projectFilter;

    return tasks.filter((task) => {
      const isSelectedProject =
        effectiveProjectFilter === "all" ||
        String(task.projectId) === String(effectiveProjectFilter);
      const projectName = projectMap[String(task.projectId)]?.title ?? "";
      const matchesSearch =
        !keyword ||
        task.title.toLowerCase().includes(keyword) ||
        task.id.toLowerCase().includes(keyword) ||
        task.description.toLowerCase().includes(keyword) ||
        task.assignee.toLowerCase().includes(keyword) ||
        projectName.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;

      return isSelectedProject && matchesSearch && matchesStatus;
    });
  }, [projectFilter, projectMap, search, selectedProjectId, statusFilter, tasks]);

  const groupedTasks = useMemo(() => {
    return statusOrder.reduce(
      (acc, status) => {
        acc[status] = filteredTasks.filter((task) => task.status === status);
        return acc;
      },
      {
        todo: [],
        in_progress: [],
        review: [],
        done: [],
      } as Record<TaskStatus, Task[]>,
    );
  }, [filteredTasks]);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle>
          {selectedProjectId
            ? `Tasks của project: ${selectedProject?.title || selectedProjectId}`
            : "Task Management"}
        </CardTitle>
        <CardDescription>
          {selectedProjectId
            ? "Chỉ hiển thị task thuộc project đang chọn. Bạn có thể tìm kiếm, lọc trạng thái và đổi chế độ xem."
            : "Quản lý task độc lập: tìm kiếm, lọc theo project/trạng thái và đổi chế độ xem."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên task, ID, assignee hoặc mô tả..."
              className="pl-9"
            />
          </div>

          {!selectedProjectId ? (
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-full xl:w-[200px]">
                <SelectValue placeholder="Lọc project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả project</SelectItem>
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
            onValueChange={(value) =>
              setStatusFilter(value as "all" | TaskStatus)
            }
          >
            <SelectTrigger className="w-full xl:w-[180px]">
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
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
          <div className="overflow-x-auto rounded-md border">
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
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-[10px]"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {projectMap[String(task.projectId)]?.title ?? "Unknown project"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusMeta[task.status].badgeClass}
                      >
                        {statusMeta[task.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={priorityMeta[task.priority].badgeClass}
                      >
                        {priorityMeta[task.priority].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage
                            src={task.assigneeAvatar}
                            alt={task.assignee}
                          />
                          <AvatarFallback className="text-xs">
                            {initials(task.assignee)}
                          </AvatarFallback>
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
                          <DropdownMenuItem
                            onClick={() => {
                              onCreateTask?.();
                            }}
                            disabled={!onCreateTask}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Tạo task mới
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem disabled>ID: {task.id}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Không có task nào khớp bộ lọc.
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
                      <CardTitle className="text-base">
                        {statusMeta[status].label}
                      </CardTitle>
                      <Badge variant="secondary">
                        {groupedTasks[status].length}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        onCreateTask?.();
                      }}
                      disabled={!onCreateTask}
                    >
                      <Plus className="h-4 w-4" />
                      Thêm task vào {statusMeta[status].label}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {groupedTasks[status].map((task) => (
                      <Card
                        key={task.id}
                        className="cursor-pointer border bg-white/95 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <CardContent className="space-y-3 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <p className="line-clamp-2 font-medium">
                                {task.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {task.id}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={priorityMeta[task.priority].badgeClass}
                            >
                              {priorityMeta[task.priority].label}
                            </Badge>
                          </div>

                          <Badge variant="secondary" className="w-fit">
                            <Target className="h-3.5 w-3.5" />
                            {projectMap[String(task.projectId)]?.title ??
                              "Unknown project"}
                          </Badge>

                          <div className="flex flex-wrap gap-1">
                            {task.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-[10px]"
                              >
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
                                <AvatarImage
                                  src={task.assigneeAvatar}
                                  alt={task.assignee}
                                />
                                <AvatarFallback className="text-[11px]">
                                  {initials(task.assignee)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium">
                                {task.assignee}
                              </span>
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
                        Không có task trong cột này.
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
  );
};

export default TaskList;
