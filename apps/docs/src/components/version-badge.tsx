import {cn} from "@/utils/cn";
import {currentVersion} from "@/utils/version";

/** The library version the documentation describes. The site serves the latest version only. */
export function VersionBadge({className}: {className?: string}) {
  return (
    <span
      className={cn(
        "items-center rounded-full bg-default px-2 py-0.5 text-xs font-medium text-muted",
        className,
      )}
    >
      v{currentVersion}
    </span>
  );
}
