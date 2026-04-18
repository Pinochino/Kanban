import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import TaskList from "@/domains/projects/TaskList";
import { useGetAllData } from "@/hooks/useGetAllData";
import { apiName } from "@/api/apiName";
import { Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useEnterSkeletonLoading } from "@/hooks/useMinimumLoading";
import { useParams, useSearchParams } from "react-router-dom";

const TaskManagement = () => {
  const { projectId: routeProjectId } = useParams();
  const [searchParams] = useSearchParams();
  const selectedProjectId = routeProjectId ?? searchParams.get("projectId");
  const projectRequestUrl = selectedProjectId
    ? `${apiName.projects.detail}/${selectedProjectId}`
    : apiName.projects.list;

  const {
    data: projectData,
    isLoading,
    isError,
  } = useGetAllData({ url: projectRequestUrl });
  const showEnterSkeleton = useEnterSkeletonLoading(isLoading, 2200);

  const displayProjects = useMemo(() => {
    if (!projectData) {
      return [];
    }

    if (Array.isArray(projectData)) {
      return projectData;
    }

    return [projectData];
  }, [projectData]);

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
            {selectedProjectId
              ? `Board task riêng của project ${selectedProjectId}.`
              : "Trang task tách riêng khỏi project để theo dõi và xử lý công việc tập trung."}
          </p>
        </CardContent>
      </Card>

      {showEnterSkeleton ? (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-80" />
            </div>
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-3 rounded-lg border p-4">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="p-6 text-sm text-red-600">
            Không thể tải dữ liệu project/task. Vui lòng tải lại trang.
          </CardContent>
        </Card>
      ) : (
        <TaskList projectList={displayProjects} selectedProjectId={selectedProjectId} />
      )}
    </div>
  );
};

export default TaskManagement;
