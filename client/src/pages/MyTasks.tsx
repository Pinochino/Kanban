import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiName } from "@/api/apiName";
import { handleApi } from "@/api/handleApi";
import TaskList from "@/domains/projects/TaskList";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useGetAllData } from "@/hooks/useGetAllData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Kanban, Bell } from "lucide-react";
import { IProject, IListTask, ITask } from "@/types/ProjectInterface";
import { INotification } from "@/types/NotificationInterface";
import { toast } from "sonner";

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
  const queryClient = useQueryClient();

  const { data: projectData, isLoading, isError } = useGetAllData({ url: apiName.projects.list });

  const { data: notifications = [], isLoading: isNotificationsLoading } = useQuery({
    queryKey: ["my-web-notifications", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<INotification[]> => {
      const res = await handleApi({
        url: apiName.notifications.myList,
        method: "GET",
        params: {
          channel: "WEB",
          unreadOnly: false,
        },
      });

      const payload = res.data?.data;
      return Array.isArray(payload) ? (payload as INotification[]) : [];
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await handleApi({
        url: `${apiName.notifications.markRead}/${notificationId}/read`,
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-web-notifications", user?.id] });
      toast.success("Đã đánh dấu thông báo đã đọc.");
    },
    onError: () => {
      toast.error("Không thể cập nhật trạng thái thông báo.");
    },
  });

  const displayProjects = useMemo(() => normalizeProjects(projectData), [projectData]);

  const unreadNotificationsCount = notifications.filter((notification) => !notification.isRead).length;

  const notificationTypeLabel = (type: string) => {
    if (type === "TASK_ASSIGNED") return "Giao task";
    if (type === "ADMIN_MESSAGE") return "Từ admin";
    if (type === "TASK_DUE") return "Đến hạn";
    if (type === "TASK_REMINDER") return "Nhắc hạn";
    return type;
  };

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

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold">
              <Bell className="h-4 w-4" />
              Thông báo công việc của bạn
            </h2>
            <p className="text-xs text-muted-foreground">{unreadNotificationsCount} chưa đọc</p>
          </div>

          {isNotificationsLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải thông báo...</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bạn không có thông báo mới.</p>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 6).map((notification) => (
                <div
                  key={notification.id}
                  className={`flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between ${
                    notification.isRead ? "bg-muted/20" : "bg-muted/40"
                  }`}
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {notification.title}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">[{notificationTypeLabel(notification.type)}]</span>
                    </p>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.deliveredAt || notification.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>

                  {!notification.isRead ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={markAsReadMutation.isPending}
                      onClick={() => markAsReadMutation.mutate(notification.id)}
                    >
                      Đánh dấu đã đọc
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
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
