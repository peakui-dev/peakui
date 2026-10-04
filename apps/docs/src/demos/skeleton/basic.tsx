import {Skeleton} from "@peakui/react";

export function Basic() {
  return (
    <div className="w-[250px] space-y-5 rounded-lg bg-surface p-4 shadow-surface">
      <Skeleton className="h-32 rounded-lg" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-3/5 rounded-lg" />
        <Skeleton className="h-3 w-4/5 rounded-lg" />
        <Skeleton className="h-3 w-2/5 rounded-lg" />
      </div>
    </div>
  );
}
