import { apiName } from '@/api/apiName';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogFooter, Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useGetAllData } from '@/hooks/useGetAllData';
import { NewTaskForm, priorityMeta, Project, ProjectStatus, statusMeta, statusOrder, TaskStatus } from '@/pages/admin/ProjectManagement';
import { ICreateTask } from '@/types/TaskInterface';
import { IUser } from '@/types/UserInterface';
import { useQuery } from '@tanstack/react-query';
import React, { FormEvent } from 'react'



const CreateTaskDiaglog = ({
    open,
    onOpenChange,
    form,
    onFormChange,
    onSubmit,
    projects,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: ICreateTask;
    onFormChange: (field: keyof ICreateTask, value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    projects: Project[];
}) => {

    const { data: userList } = useGetAllData({ url: apiName.accounts.list })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <form className="space-y-4" onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create task</DialogTitle>
                        <DialogDescription>
                            Add a new card into a specific project to keep task and project
                            progress synchronized.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 md:grid-cols-2">

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="task-title">Title</Label>
                            <Input
                                id="task-title"
                                value={form.title}
                                onChange={(event) => onFormChange("title", event.target.value)}
                                placeholder="Example: Build drag-and-drop for card sorting"
                                required
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="task-description">Description</Label>
                            <Textarea
                                id="task-description"
                                value={form.description}
                                onChange={(event) =>
                                    onFormChange("description", event.target.value)
                                }
                                placeholder="Describe acceptance criteria, context, and blockers..."
                                className="min-h-[120px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="task-assignee">Assignee</Label>
                            <Select
                                value={form.assignedAccountId}
                                onValueChange={(value) => onFormChange("assignedAccountId", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose user" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(Array.isArray(userList) ? Array.from(userList) : []).map((user: IUser) => (
                                        <SelectItem key={user.id} value={user.id}>
                                            {user.username}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="task-due-date">Due date</Label>
                            <Input
                                id="task-due-date"
                                type="date"
                                value={form.dueDate}
                                onChange={(event) =>
                                    onFormChange("dueDate", event.target.value)
                                }
                            />
                        </div>


                        {/* <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select
                                value={form.priority}
                                onValueChange={(value) => onFormChange("priority", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(Object.keys(priorityMeta) as TaskPriority[]).map(
                                        (priority) => (
                                            <SelectItem key={priority} value={priority}>
                                                {priorityMeta[priority].label}
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                        </div> */}

                        {/* <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="task-tags">Tags</Label>
                            <Input
                                id="task-tags"
                                value={form.tags}
                                onChange={(event) => onFormChange("tags", event.target.value)}
                                placeholder="Kanban, UI, Sprint 12"
                            />
                        </div> */}
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit">Create task</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};


export default CreateTaskDiaglog