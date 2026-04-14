import { Card, CardContent } from "@/components/ui/card";
import TaskList from "@/domains/projects/TaskList";
import { useGetAllData } from "@/hooks/useGetAllData";
import { apiName } from "@/api/apiName";
import { initialProjects, initialTasks } from "./ProjectManagement";
import { Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

const TaskManagement = () => {
  const { data: projectList } = useGetAllData({ url: apiName.projects.list });
  const [searchParams] = useSearchParams();
  const selectedProjectId = searchParams.get("projectId");

  const displayProjects = useMemo(() => {
    if (Array.isArray(projectList) && projectList.length > 0) {
      return projectList;
    }

    return initialProjects.map((project) => ({
      id: project.id,
      title: project.name,
      description: project.summary,
      createdBy: {
        id: String(project.id),
        username: project.owner,
      },
    }));
  }, [projectList]);

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white shadow-xl">
        <CardContent className="flex flex-col gap-3 p-6">
          <p className="inline-flex items-center gap-2 text-sm text-slate-200">
            <Sparkles className="h-4 w-4" />
            Task workspace
          </p>
          <h1 className="text-2xl font-semibold md:text-3xl">Task Management</h1>
          <p className="max-w-2xl text-sm text-slate-200">
            Trang task tách riêng khỏi project để theo dõi và xử lý công việc tập trung.
          </p>
        </CardContent>
      </Card>

      <TaskList
        projectList={displayProjects}
        selectedProjectId={selectedProjectId}
        tasks={initialTasks}
      />
    </div>
  );
};

export default TaskManagement;
