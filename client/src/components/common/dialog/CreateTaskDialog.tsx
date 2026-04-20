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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";

type TaskDateErrors = {
  dueDate?: string;
  reminderDate?: string;
};

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ICreateTask;
  onFieldChange: (field: keyof ICreateTask, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  project?: IProject | null;
  columnLabel?: string;
  dateErrors?: TaskDateErrors;
  isSubmitting?: boolean;
}

const parseDateValue = (value?: string): Date | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const CreateTaskDialog = ({
  open,
  onOpenChange,
  form,
  onFieldChange,
  onSubmit,
  project,
  columnLabel,
  dateErrors,
  isSubmitting = false,
}: CreateTaskDialogProps) => {
  const { data: userList } = useGetAllData({ url: apiName.accounts.list });
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form className="space-y-4" onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{t("taskBoard.createTask")}</DialogTitle>
            <DialogDescription>{t("taskBoard.createTaskDialogDescription")}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            {project ? <Badge variant="secondary">{t("taskBoard.projectBadge")}: {project.title}</Badge> : null}
            {columnLabel ? <Badge variant="outline">{t("taskBoard.columnBadge")}: {columnLabel}</Badge> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="task-title">{t("taskBoard.title")}</Label>
              <Input
                id="task-title"
                value={form.title}
                onChange={(event) => onFieldChange("title", event.target.value)}
                placeholder={t("taskBoard.exampleTitle")}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="task-description">{t("taskBoard.description")}</Label>
              <Textarea
                id="task-description"
                value={form.description}
                onChange={(event) => onFieldChange("description", event.target.value)}
                placeholder={t("taskBoard.exampleDescription")}
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-assignee">{t("taskBoard.tableAssignee")}</Label>
              <select
                id="task-assignee"
                value={form.assignedAccountId}
                onChange={(event) => onFieldChange("assignedAccountId", event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">{t("taskBoard.chooseUser")}</option>
                {(Array.isArray(userList) ? Array.from(userList) : []).map((user: IUser) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-due-date">{t("taskBoard.dueDate")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="task-due-date"
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.dueDate && "text-muted-foreground",
                      dateErrors?.dueDate && "border-destructive",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.dueDate ? format(parseDateValue(form.dueDate) ?? new Date(), "dd/MM/yyyy") : t("taskBoard.selectDueDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={parseDateValue(form.dueDate)}
                    onSelect={(date) => onFieldChange("dueDate", date ? format(date, "yyyy-MM-dd") : "")}
                    className="p-3 pointer-events-auto"
                  />
                  {form.dueDate ? (
                    <div className="border-t p-2">
                      <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => onFieldChange("dueDate", "")}>{t("taskBoard.clearDueDate")}</Button>
                    </div>
                  ) : null}
                </PopoverContent>
              </Popover>
              {dateErrors?.dueDate ? (
                <p className="text-xs text-destructive">{dateErrors.dueDate}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-reminder-date">{t("taskBoard.reminderDate")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="task-reminder-date"
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.reminderDate && "text-muted-foreground",
                      dateErrors?.reminderDate && "border-destructive",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.reminderDate ? format(parseDateValue(form.reminderDate) ?? new Date(), "dd/MM/yyyy") : t("taskBoard.selectReminderDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={parseDateValue(form.reminderDate)}
                    onSelect={(date) => onFieldChange("reminderDate", date ? format(date, "yyyy-MM-dd") : "")}
                    className="p-3 pointer-events-auto"
                  />
                  {form.reminderDate ? (
                    <div className="border-t p-2">
                      <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => onFieldChange("reminderDate", "")}>{t("taskBoard.clearReminderDate")}</Button>
                    </div>
                  ) : null}
                </PopoverContent>
              </Popover>
              {dateErrors?.reminderDate ? (
                <p className="text-xs text-destructive">{dateErrors.reminderDate}</p>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              {t("taskBoard.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("taskBoard.creating")}
                </span>
              ) : (
                t("taskBoard.createTask")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
