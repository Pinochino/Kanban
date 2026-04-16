import { useMemo } from "react";

import { apiName } from "@/api/apiName";
import TaskList from "@/domains/projects/TaskList";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useGetAllData } from "@/hooks/useGetAllData";
import { Card, CardContent } from "@/components/ui/card";
import { Kanban } from "lucide-react";
import { IProject, IListTask, ITask } from "@/types/ProjectInterface";

const normalizeProjects = (projectData: unknown): IProject[] => {
  if (Array.isArray(projectData)) {
    return projectData as IProject[];
  }

  if (projectData && typeof projectData === "object") {
    const listFromContent = (projectData as { content?: unknown }).content;
    if (Array.isArray(listFromContent)) {
      return listFromContent as IProject[];
    }

    if ("id" in (projectData as object)) {
      return [projectData as IProject];
    }
  }

  return [];
};

const MyTasks = () => {
  const { user } = useCurrentUser();

  const { data: projectData, isLoading, isError } = useGetAllData({ url: apiName.projects.list });

  const displayProjects = useMemo(() => normalizeProjects(projectData), [projectData]);

  const myProjects = useMemo(() => {
    if (!user?.id) {
      return [];
    }

    return displayProjects.filter((project) =>
      (project.listTasks ?? []).some((listTask: IListTask) =>
        (listTask.taskList ?? []).some((task: ITask) => String(task.assignedAccount?.id ?? "") === String(user.id)),
      ),
    );
  }, [displayProjects, user?.id]);

  const stats = useMemo(() => {
    const tasks = displayProjects.flatMap((project) =>
      (project.listTasks ?? []).flatMap((listTask: IListTask) =>
        (listTask.taskList ?? [])
          .filter((task: ITask) => String(task.assignedAccount?.id ?? "") === String(user?.id ?? ""))
          .map((task: ITask) => ({ status: String(listTask.status) })),
      ),
    );

    const total = tasks.length;
    const done = tasks.filter((task) => String(task.status).toLowerCase() === "done").length;

    return {
      total,
      done,
      projectCount: myProjects.length,
      completion: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  }, [displayProjects, myProjects.length, user?.id]);

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white shadow-xl">
        <CardContent className="flex flex-col gap-3 p-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-sm text-slate-200">
              <Kanban className="h-4 w-4" />
              Personal kanban workspace
            </p>
            <h1 className="text-2xl font-semibold md:text-3xl">Task của tôi</h1>
            <p className="max-w-2xl text-sm text-slate-200">
              Bạn đang xem board Kanban của các project có task được giao cho mình. Có thể kéo task sang cột trạng
              thái khác để cập nhật tiến độ.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-xs text-slate-200">Tasks</p>
              <p className="text-2xl font-semibold">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-xs text-slate-200">Projects</p>
              <p className="text-2xl font-semibold">{stats.projectCount}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-xs text-slate-200">Done</p>
              <p className="text-2xl font-semibold">{stats.completion}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Đang tải task của bạn...</CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="p-6 text-sm text-red-600">
            Không thể tải dữ liệu task. Vui lòng thử lại sau.
          </CardContent>
        </Card>
      ) : myProjects.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Bạn chưa được giao task nào.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {myProjects.map((project) => (
            <TaskList
              key={project.id}
              projectList={[project]}
              selectedProjectId={project.id}
              currentUserId={user?.id}
              canManageTasks={false}
              allowTaskDrag
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTasks;
