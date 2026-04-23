import { useMemo } from "react";

import { apiName } from "@/api/apiName";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useGetAllData } from "@/hooks/useGetAllData";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Kanban } from "lucide-react";
import { IProject, IListTask, ITask } from "@/types/ProjectInterface";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useI18n } from "@/i18n/I18nProvider";

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
  const { t } = useI18n();

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
              {t("taskBoard.personalWorkspace")}
            </p>
            <h1 className="text-2xl font-semibold md:text-3xl">{t("taskBoard.myTasksTitle")}</h1>
            <p className="max-w-2xl text-sm text-slate-200">{t("taskBoard.myTasksDescription")}</p>
          </div>

          <div className="grid w-full gap-2 sm:grid-cols-3 md:w-auto md:min-w-[360px]">
            <div className="min-w-[110px] rounded-xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-xs text-slate-200">{t("taskBoard.statTasks")}</p>
              <p className="text-2xl font-semibold">{stats.total}</p>
            </div>
            <div className="min-w-[110px] rounded-xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-xs text-slate-200">{t("taskBoard.statProjects")}</p>
              <p className="text-2xl font-semibold">{stats.projectCount}</p>
            </div>
            <div className="min-w-[110px] rounded-xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-xs text-slate-200">{t("taskBoard.statCompleted")}</p>
              <p className="text-2xl font-semibold">{stats.completion}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-6">
          <div>
            <h2 className="text-base font-semibold">{t("taskBoard.notificationsTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("taskBoard.notificationsDescription")}</p>
          </div>
          <Button asChild>
            <Link to="/notifications">{t("taskBoard.openNotifications")}</Link>
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">{t("taskBoard.loadingTasks")}</CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="p-6 text-sm text-red-600">
            {t("taskBoard.loadFailed")}
          </CardContent>
        </Card>
      ) : myProjects.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {t("taskBoard.noAssignedTasks")}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">{t("taskBoard.statProjects")}</h2>
              <p className="text-sm text-muted-foreground">{t("taskBoard.selectProject")}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {myProjects.map((project) => {
                const myTasks = (project.listTasks ?? []).flatMap((listTask: IListTask) =>
                  (listTask.taskList ?? []).filter((task: ITask) => String(task.assignedAccount?.id ?? "") === String(user?.id ?? "")),
                );
                const doneCount = myTasks.filter((task: ITask) => String(task.listTaskStatus ?? "").toLowerCase() === "done").length;

                return (
                  <Card key={project.id} className="border border-slate-200">
                    <CardContent className="space-y-3 p-4">
                      <h3 className="line-clamp-2 text-base font-semibold">{project.title}</h3>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{project.description || t("projectList.noDescription")}</p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{myTasks.length} {t("taskBoard.statTasks")}</span>
                        <span>{doneCount} {t("taskBoard.statCompleted")}</span>
                      </div>

                      <Button className="w-full" variant="outline" asChild>
                        <Link to={`/my-tasks/${project.id}/tasks`}>
                          <ArrowRight className="h-4 w-4" />
                          {t("projectList.openTasks")}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
        )}
    </div>
  );
};

export default MyTasks;
