import { apiName } from "@/api/apiName";
import { handleApi } from "@/api/handleApi";
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
import { ICreateTask } from "@/types/TaskInterface";
import { IProject } from "@/types/ProjectInterface";
import { Badge } from "@/components/ui/badge";
import { FormEvent, useMemo, useState } from "react";
import { IUser } from "@/types/UserInterface";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";
import { useQuery } from "@tanstack/react-query";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

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
  const [assigneeOpen, setAssigneeOpen] = useState(false);

  const { data: userListData } = useQuery({
    queryKey: [apiName.accounts.list, "task-assignees"],
    queryFn: async () => {
      const res = await handleApi({
        url: apiName.accounts.list,
        method: "GET",
        params: { page: 0, size: 200 },
        withCredentials: true,
      });

      return res.data.data;
    },
  });
  const { t } = useI18n();

  const users = useMemo(() => {
    if (Array.isArray(userListData)) {
      return userListData as IUser[];
    }

    if (userListData && typeof userListData === "object") {
      const withContent = userListData as { content?: unknown; items?: unknown };

      if (Array.isArray(withContent.content)) {
        return withContent.content as IUser[];
      }

      if (Array.isArray(withContent.items)) {
        return withContent.items as IUser[];
      }
    }

    return [] as IUser[];
  }, [userListData]);

  const selectedAssignee = useMemo(
    () => users.find((user) => String(user.id) === String(form.assignedAccountId ?? "")),
    [users, form.assignedAccountId],
  );

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
              <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="task-assignee"
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={assigneeOpen}
                    className={cn(
                      "w-full justify-between",
                      !selectedAssignee && "text-muted-foreground",
                    )}
                  >
                    <span className="truncate">
                      {selectedAssignee
                        ? `${selectedAssignee.username}${selectedAssignee.email ? ` (${selectedAssignee.email})` : ""}`
                        : t("taskBoard.chooseUser")}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[340px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder={`${t("taskBoard.chooseUser")}...`} />
                    <CommandList>
                      <CommandEmpty>{t("taskBoard.loadFailed")}</CommandEmpty>
                      <CommandGroup>
                        {users.map((user: IUser) => {
                          const isSelected = String(form.assignedAccountId) === String(user.id);

                          return (
                            <CommandItem
                              key={user.id}
                              value={`${user.username ?? ""} ${user.email ?? ""} ${user.id ?? ""}`}
                              onSelect={() => {
                                onFieldChange("assignedAccountId", String(user.id));
                                setAssigneeOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                              <span className="truncate">{user.username}</span>
                              {user.email ? <span className="ml-2 truncate text-xs text-muted-foreground">{user.email}</span> : null}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
            <Button type="submit" disabled={isSubmitting || !form.assignedAccountId}>
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
