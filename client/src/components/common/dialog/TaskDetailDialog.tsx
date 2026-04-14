import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogFooter, Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { calcTaskCompletion, initials, priorityMeta, statusMeta, TaskStatus, formatDate } from '@/pages/admin/ProjectManagement';
import { Avatar, AvatarImage, AvatarFallback } from '@radix-ui/react-avatar';
import {  CalendarDays, MessageSquare, Paperclip } from 'lucide-react';
import React from 'react'

type Task = {
  id: string;
  projectId: string;
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

const TaskDetailDialog = ({
  task,
  projectName,
  onOpenChange,
}: {
  task: Task | null;
  projectName: string;
  onOpenChange: (state: boolean) => void;
}) => {

  console.log("task: ", task)

  return (
    <Dialog open={Boolean(task)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {task ? (
          <div className="space-y-5">
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "capitalize",
                    statusMeta[task.status].badgeClass,
                  )}
                >
                  {statusMeta[task.status].label}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "capitalize",
                    priorityMeta[task.priority].badgeClass,
                  )}
                >
                  {priorityMeta[task.priority].label}
                </Badge>
                <Badge variant="outline">{task.id}</Badge>
                <Badge variant="secondary">{projectName}</Badge>
              </div>
              <DialogTitle className="pt-2 text-xl">{task.title}</DialogTitle>
              <DialogDescription>{task.description}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Assignee
                </p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={task.assigneeAvatar}
                      alt={task.assignee}
                    />
                    <AvatarFallback>{initials(task.assignee)}</AvatarFallback>
                  </Avatar>
                  <p className="font-medium">{task.assignee}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Due date
                </p>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  {formatDate(task.dueDate)}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Checklist
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {task.checklistDone}/{task.checklistTotal} complete
                  </p>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        // width: `${calcTaskCompletion(task)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Resources
                </p>
                <div className="flex gap-4 text-sm font-medium">
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    {task.comments} comments
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    {task.attachments} files
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailDialog