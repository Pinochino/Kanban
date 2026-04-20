import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyProps = {
  title?: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
};

export function Empty({
  title = "Không có dữ liệu",
  description,
  icon,
  className,
}: EmptyProps) {
  return (
    <div
      className={cn(
        "flex min-h-24 flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/20 px-4 py-6 text-center",
        className,
      )}
    >
      {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      <p className="text-sm font-medium">{title}</p>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
    </div>
  );
}
