import { Skeleton } from "@/components/ui/skeleton";

type RoutePageSkeletonProps = {
  compact?: boolean;
};

export default function RoutePageSkeleton({ compact = false }: RoutePageSkeletonProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: compact ? 3 : 6 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-lg border bg-background p-4">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
