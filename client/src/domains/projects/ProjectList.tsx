import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { IProject } from "@/types/ProjectInterface";
import { ChevronRight, FolderKanban, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

const ProjectList = ({
    projectList,
}: {
    projectList: IProject[];
}) => {
    const projects = (Array.isArray(projectList) && Array.from(projectList)) || [];

    return (
        <Card>
            <CardHeader className="space-y-3">
                <CardTitle>Danh sách Projects</CardTitle>
                <CardDescription>
                    Trang này tách riêng cho project. Chọn project để mở trang task riêng của project đó.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
                {projects.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                        Chưa có project nào để hiển thị.
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {projects.map((project) => {
                            const totalTasks = (project.listTasks ?? []).reduce(
                                (count, listTask) => count + (listTask.taskList?.length ?? 0),
                                0,
                            );

                            const doneTasks = (project.listTasks ?? []).reduce((count, listTask) => {
                                const status = String(listTask.status).toLowerCase();
                                return status === "done" ? count + (listTask.taskList?.length ?? 0) : count;
                            }, 0);

                            const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

                            return (
                                <Card
                                    key={project.id}
                                    className="border-border"
                                >
                                    <CardContent className="space-y-4 p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 space-y-1">
                                                <p className="line-clamp-2 font-semibold">{project.title}</p>
                                                <p className="line-clamp-2 text-xs text-muted-foreground">
                                                    {project.description || "Không có mô tả"}
                                                </p>
                                            </div>
                                            <FolderKanban className="h-5 w-5 shrink-0 text-primary" />
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span className="inline-flex items-center gap-1">
                                                <UserRound className="h-3.5 w-3.5" />
                                                {project?.createdBy?.username || "Unknown"}
                                            </span>
                                            <Badge variant="outline">ID: {project.id}</Badge>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>Progress</span>
                                                <span>
                                                    {doneTasks}/{totalTasks} ({progress}%)
                                                </span>
                                            </div>
                                            <div className="h-2 rounded-full bg-slate-200">
                                                <div
                                                    className="h-2 rounded-full bg-emerald-500"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            asChild
                                        >
                                            <Link to={`/projects/${project.id}/tasks`}>
                                                <ChevronRight className="h-4 w-4" />
                                                Mở task của project
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ProjectList;
