import React, { FormEvent, useCallback, useMemo, useState } from "react";
import { Plus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGetAllData } from "@/hooks/useGetAllData";
import { apiName } from "@/api/apiName";
import { ICreateProject } from "@/types/ProjectInterface";
import { handleApi } from "@/api/handleApi";
import ProjectList from "@/domains/projects/ProjectList";
import CreateProjectDiaglog from "@/components/common/dialog/CreateProjectDialog";
import { toast } from "sonner";

export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type ProjectStatus = "planning" | "on_track" | "at_risk" | "completed";

export type Project = {
  id: string | number;
  name: string;
  summary: string;
  owner: string;
  startDate: string;
  dueDate: string;
  status: ProjectStatus;
};

export type Task = {
  id: string;
  projectId: string | number;
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

export type NewTaskForm = {
  projectId: string;
  title: string;
  description: string;
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

export const statusOrder: TaskStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "review",
  "done",
];

export const initialProjects: Project[] = [
  {
    id: "PRJ-101",
    name: "Workspace Performance",
    summary:
      "Optimize board loading speed and rendering scalability for large teams.",
    owner: "Daniel Tran",
    startDate: "2026-03-20",
    dueDate: "2026-04-22",
    status: "on_track",
  },
  {
    id: "PRJ-102",
    name: "Enterprise Access Control",
    summary:
      "Finalize role permissions and secure admin workflows before enterprise rollout.",
    owner: "Hoang Vu",
    startDate: "2026-03-12",
    dueDate: "2026-04-18",
    status: "at_risk",
  },
  {
    id: "PRJ-103",
    name: "Team Productivity Toolkit",
    summary:
      "Ship planning templates, bulk operations, and notification improvements.",
    owner: "Linh Nguyen",
    startDate: "2026-03-28",
    dueDate: "2026-04-28",
    status: "planning",
  },
];

export const initialTasks: Task[] = [
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

export const defaultNewProject: NewProjectForm = {
  name: "",
  summary: "",
  owner: "",
  startDate: "",
  dueDate: "",
  status: "planning",
};

export const defaultNewTask: NewTaskForm = {
  projectId: "",
  title: "",
  description: "",
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

const ProjectManagement = () => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] =
    useState(false);
  const [newProject, setNewProject] =
    useState<NewProjectForm>(defaultNewProject);
  const [projectInput, setProjectInput] = useState<ICreateProject>({
    title: "",
    description: "",
    isPublic: null,
    assignAccountId: null,
  });
  const [projectPublic, setProjectPublic] = useState<boolean>(false);

  const queryClient = useQueryClient();

  const { data: projectList } = useGetAllData({ url: apiName.projects.list });

  const displayProjects = useMemo(() => {
    if (Array.isArray(projectList) && projectList.length > 0) {
      return projectList.map((project: any) => ({
        id: project.id,
        name: project.title,
        summary: project.description ?? "",
        owner: project.createdBy?.username ?? "Unknown",
        startDate: "",
        dueDate: "",
        status: "planning" as ProjectStatus,
      }));
    }

    return projects;
  }, [projectList, projects]);

  const projectMap = useMemo(() => {
    return displayProjects.reduce(
      (acc, project) => {
        acc[String(project.id)] = project;
        return acc;
      },
      {} as Record<string, Project>,
    );
  }, [displayProjects]);

  const handleProjectFormChange = (
    field: keyof ICreateProject,
    value: string,
  ) => {
    setProjectInput((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const createdProject = {
      ...projectInput,
      isPublic: projectPublic,
    };

    const res = await handleApi({
      url: apiName.projects.create,
      method: "POST",
      withCredentials: true,
      data: createdProject,
    });
    setNewProject(defaultNewProject);
    const createdId = res?.data?.data?.id;
    setIsCreateProjectDialogOpen(false);
    return res.data.data;
  };

  const CreateProjectMutation = useMutation({
    mutationFn: handleCreateProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${apiName.projects.list}`] });
      toast.success("Create Project successfully")
    },
  });

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white shadow-xl">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-sm text-slate-200">
              <Sparkles className="h-4 w-4" />
              Project control center
            </p>
            <h1 className="text-2xl font-semibold md:text-3xl">
              Project Management
            </h1>
            <p className="max-w-2xl text-sm text-slate-200">
              Quản lý danh sách project tập trung. Trang task được tách riêng để thao tác chi tiết.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Dialog
              open={isCreateProjectDialogOpen}
              onOpenChange={setIsCreateProjectDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="bg-white text-slate-900 hover:bg-slate-100"
                >
                  <Plus className="h-4 w-4" />
                  Create project
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <ProjectList projectList={projectList} />

      <CreateProjectDiaglog
        open={isCreateProjectDialogOpen}
        onOpenChange={setIsCreateProjectDialogOpen}
        form={projectInput}
        onFormChange={handleProjectFormChange}
        onSubmit={(e) => CreateProjectMutation.mutate(e)}
        projectPublic={projectPublic}
        setProjectPublic={setProjectPublic}
      />
    </div>
  );
};

export default ProjectManagement;
