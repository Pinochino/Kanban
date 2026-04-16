import { apiName } from "@/api/apiName";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGetAllData } from "@/hooks/useGetAllData";
import { ICreateTask } from "@/types/TaskInterface";
import { IProject } from "@/types/ProjectInterface";
import { Badge } from "@/components/ui/badge";
import { FormEvent } from "react";
import { IUser } from "@/types/UserInterface";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ICreateTask;
  onFieldChange: (field: keyof ICreateTask, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  project?: IProject | null;
  columnLabel?: string;
}

const CreateTaskDialog = ({
  open,
  onOpenChange,
  form,
  onFieldChange,
  onSubmit,
  project,
  columnLabel,
}: CreateTaskDialogProps) => {
  const { data: userList } = useGetAllData({ url: apiName.accounts.list });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form className="space-y-4" onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Create task</DialogTitle>
            <DialogDescription>
              Tạo task trực tiếp vào cột trạng thái đang chọn.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            {project ? <Badge variant="secondary">Project: {project.title}</Badge> : null}
            {columnLabel ? <Badge variant="outline">Column: {columnLabel}</Badge> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={form.title}
                onChange={(event) => onFieldChange("title", event.target.value)}
                placeholder="Example: Build drag-and-drop for card sorting"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={form.description}
                onChange={(event) => onFieldChange("description", event.target.value)}
                placeholder="Describe acceptance criteria, context, and blockers..."
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-assignee">Assignee</Label>
              <select
                id="task-assignee"
                value={form.assignedAccountId}
                onChange={(event) => onFieldChange("assignedAccountId", event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Choose user</option>
                {(Array.isArray(userList) ? Array.from(userList) : []).map((user: IUser) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-due-date">Due date</Label>
              <Input
                id="task-due-date"
                type="date"
                value={form.dueDate}
                onChange={(event) => onFieldChange("dueDate", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-reminder-date">Reminder date</Label>
              <Input
                id="task-reminder-date"
                type="date"
                value={form.reminderDate}
                onChange={(event) => onFieldChange("reminderDate", event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
