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
import { ChevronDown, ChevronUp, FolderKanban, UserRound } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

const ProjectList = ({
    projectList,
    expandProjectId,
    setExpandedProjectId,
}: {
    projectList: IProject[];
    expandProjectId?: string | number | null;
    setExpandedProjectId?: React.Dispatch<React.SetStateAction<string | number | null>>;
}) => {
    const projects = (Array.isArray(projectList) && Array.from(projectList)) || [];

    return (
        <Card>
            <CardHeader className="space-y-3">
                <CardTitle>Danh sách Projects</CardTitle>
                <CardDescription>
                    Trang này ưu tiên project trước. Nhấn vào từng project để mở phần task tương ứng bên dưới.
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
                            const isExpanded = expandProjectId === project.id;

                            return (
                                <Card
                                    key={project.id}
                                    className={isExpanded ? "border-primary bg-primary/5" : "border-border"}
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

                                        <Button
                                            variant={isExpanded ? "default" : "outline"}
                                            className="w-full"
                                            asChild={!setExpandedProjectId}
                                            onClick={() => setExpandedProjectId?.(isExpanded ? null : project.id)}
                                        >
                                            {setExpandedProjectId ? (
                                                isExpanded ? (
                                                    <>
                                                        <ChevronUp className="h-4 w-4" />
                                                        Ẩn task
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronDown className="h-4 w-4" />
                                                        Xem task
                                                    </>
                                                )
                                            ) : (
                                                <Link to={`/tasks?projectId=${project.id}`}>
                                                    <ChevronDown className="h-4 w-4" />
                                                    Mở trang task
                                                </Link>
                                            )}
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
