import {cn} from "@/utils/cn";

/** Placeholder wordmark until PeakUI has a logo of its own. */
export function PeakUILogo({className}: {className?: string}) {
  return (
    <span className={cn("text-lg font-semibold tracking-tight text-foreground", className)}>
      PeakUI
    </span>
  );
}
