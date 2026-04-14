import { Button } from "@/components/ui/button";
import {
  DialogHeader,
  DialogFooter,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ICreateProject } from "@/types/ProjectInterface";
import React, { FormEvent } from "react";

const CreateProjectDiaglog = ({
  projectPublic,
  setProjectPublic,
  open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
}: {
  projectPublic: boolean;
  setProjectPublic: React.Dispatch<React.SetStateAction<boolean>>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ICreateProject;
  onFormChange: (field: keyof ICreateProject, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) => {
  console.log(onFormChange);
  console.log("open: ", open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form className="space-y-4" onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Create project</DialogTitle>
            <DialogDescription>
              Add a new project with owner, timeline, and status to track
              project-level progress.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                value={form.title}
                onChange={(event) => onFormChange("title", event.target.value)}
                placeholder="Example: Mobile Release v2"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="project-summary">Summary</Label>
              <Textarea
                id="project-description"
                value={form.description}
                onChange={(event) =>
                  onFormChange("description", event.target.value)
                }
                placeholder="Describe objective, scope, and expected outcome..."
                className="min-h-[100px]"
                required
              />
            </div>

            <div className="space-y-2 flex flex-col">
              <Label htmlFor="project-public">Public: </Label>
              <Switch
                checked={projectPublic}
                onCheckedChange={(checked) => setProjectPublic(checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Create project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDiaglog;
