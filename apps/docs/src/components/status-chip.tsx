"use client";

import {useDictionary} from "@/hooks/use-dictionary";
import {cn} from "@/utils/cn";

export type StatusChipStatus = "new" | "new-dot" | "preview" | "updated";

interface StatusChipProps {
  status: StatusChipStatus;
  className?: string;
}

const CHIP_BASE = "inline-flex h-5 items-center rounded-full px-1.5 text-[10px] leading-none";

export function StatusChip({className, status}: StatusChipProps) {
  const dict = useDictionary().statusChip;

  if (status === "new") {
    return (
      <span className={cn(CHIP_BASE, "bg-pink-400/8 font-semibold text-pink-400/90", className)}>
        {dict.new}
      </span>
    );
  }

  if (status === "preview") {
    return (
      <span className={cn(CHIP_BASE, "border border-foreground/10 text-foreground/60", className)}>
        {dict.preview}
      </span>
    );
  }

  if (status === "updated") {
    return (
      <span className={cn(CHIP_BASE, "bg-black/3 text-muted/90 dark:bg-white/8", className)}>
        {dict.updated}
      </span>
    );
  }

  return null;
}
