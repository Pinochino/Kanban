import { FormEvent, useMemo, useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiName } from "@/api/apiName";
import { handleApi } from "@/api/handleApi";
import CreateProjectDiaglog from "@/components/common/dialog/CreateProjectDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import ProjectList from "@/domains/projects/ProjectList";
import { useGetAllData } from "@/hooks/useGetAllData";
import { ICreateProject, IProject } from "@/types/ProjectInterface";

const defaultCreateProjectForm: ICreateProject = {
  title: "",
  description: "",
  isPublic: "false",
  assignAccountId: "",
};

const ProjectManagement = () => {
  const queryClient = useQueryClient();

  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [projectInput, setProjectInput] = useState<ICreateProject>(defaultCreateProjectForm);
  const [projectPublic, setProjectPublic] = useState<boolean>(false);

  const {
    data: projectList,
    isLoading: isProjectListLoading,
    isError: isProjectListError,
    refetch: refetchProjectList,
  } = useGetAllData({ url: apiName.projects.list });

  const displayProjects = useMemo(() => {
    if (Array.isArray(projectList)) {
      return projectList as IProject[];
    }

    if (projectList && typeof projectList === "object") {
      const listFromContent = (projectList as { content?: unknown }).content;
      if (Array.isArray(listFromContent)) {
        return listFromContent as IProject[];
      }

      if ("id" in (projectList as object)) {
        return [projectList as IProject];
      }
    }

    return [];
  }, [projectList]);

  const projectStats = useMemo(() => {
    const totalProjects = displayProjects.length;

    const allTasks = displayProjects.flatMap((project) =>
      (project.listTasks ?? []).flatMap((listTask) => listTask.taskList ?? []),
    );

    const totalTasks = allTasks.length;
    const doneTasks = (displayProjects ?? []).reduce((acc, project) => {
      const doneColumn = (project.listTasks ?? []).find((listTask) => {
        const status = String(listTask.status).toLowerCase();
        return status === "done";
      });

      return acc + (doneColumn?.taskList?.length ?? 0);
    }, 0);

    const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    return { totalProjects, totalTasks, doneTasks, completionRate };
  }, [displayProjects]);

  const handleProjectFormChange = (field: keyof ICreateProject, value: string) => {
    setProjectInput((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const createdProjectPayload = {
      ...projectInput,
      isPublic: String(projectPublic),
    };

    const response = await handleApi({
      url: apiName.projects.create,
      method: "POST",
      withCredentials: true,
      data: createdProjectPayload,
    });

    setProjectInput(defaultCreateProjectForm);
    setIsCreateProjectDialogOpen(false);

    return response?.data?.data;
  };

  const createProjectMutation = useMutation({
    mutationFn: handleCreateProject,
    onSuccess: async (createdProject) => {
      queryClient.setQueryData([apiName.projects.list], (oldProjects: IProject[] | undefined) => {
        const currentProjects = Array.isArray(oldProjects) ? oldProjects : [];
        return [...currentProjects, createdProject as IProject];
      });

      await queryClient.invalidateQueries({ queryKey: [apiName.projects.list] });
      await refetchProjectList();
      toast.success("Create project successfully");
    },
    onError: () => {
      toast.error("Create project failed");
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
            <h1 className="text-2xl font-semibold md:text-3xl">Project Management</h1>
            <p className="max-w-2xl text-sm text-slate-200">
              Trang này chỉ quản lý project. Nhấn vào từng project để mở trang task riêng theo project đó.
            </p>
          </div>

          <Dialog open={isCreateProjectDialogOpen} onOpenChange={setIsCreateProjectDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100">
                <Plus className="h-4 w-4" />
                Create project
              </Button>
            </DialogTrigger>
          </Dialog>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Projects</p>
            <p className="text-2xl font-semibold">{projectStats.totalProjects}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total tasks</p>
            <p className="text-2xl font-semibold">{projectStats.totalTasks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Completed tasks</p>
            <p className="text-2xl font-semibold">{projectStats.doneTasks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Overall progress</p>
            <p className="text-2xl font-semibold">{projectStats.completionRate}%</p>
            <div className="mt-2 h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-emerald-500"
                style={{ width: `${projectStats.completionRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {isProjectListLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Đang tải danh sách project...</CardContent>
        </Card>
      ) : isProjectListError ? (
        <Card>
          <CardContent className="p-6 text-sm text-red-600">
            Không thể tải danh sách project. Vui lòng tải lại trang.
          </CardContent>
        </Card>
      ) : (
        <ProjectList projectList={displayProjects} />
      )}

      <CreateProjectDiaglog
        open={isCreateProjectDialogOpen}
        onOpenChange={setIsCreateProjectDialogOpen}
        form={projectInput}
        onFormChange={handleProjectFormChange}
        onSubmit={(event) => createProjectMutation.mutate(event)}
        projectPublic={projectPublic}
        setProjectPublic={setProjectPublic}
      />
    </div>
  );
};

export default ProjectManagement;
