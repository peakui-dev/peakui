"use client";

import type {ButtonProps} from "@peakui/react";
import type {ComponentProps} from "react";

import {Button, Kbd} from "@peakui/react";
import {useI18n} from "fumadocs-ui/contexts/i18n";
import {useSearchContext} from "fumadocs-ui/contexts/search";

import {Search} from "@/components/fumadocs/ui/icons";
import {cn} from "@/utils/cn";

interface SearchToggleProps extends Omit<ButtonProps, "className" | "onPress"> {
  className?: string;
  hideIfDisabled?: boolean;
}

export function SearchToggle({
  className,
  hideIfDisabled,
  size = "sm",
  variant = "tertiary",
  ...props
}: SearchToggleProps) {
  const {enabled, hotKey, setOpenSearch} = useSearchContext();

  if (hideIfDisabled && !enabled) return null;

  const shortcut = hotKey.map((key) => key.display).join("");

  return (
    <span title={shortcut ? `Search (${shortcut})` : "Search"}>
      <Button
        {...props}
        isIconOnly
        aria-label="Open Search"
        className={cn("size-[34px] border-none", className)}
        data-search=""
        size={size}
        type="button"
        variant={variant}
        onPress={() => {
          setOpenSearch(true);
        }}
      >
        <Search />
      </Button>
    </span>
  );
}

export function LargeSearchToggle({
  hideIfDisabled,
  ...props
}: ComponentProps<"button"> & {
  hideIfDisabled?: boolean;
}) {
  const {enabled, hotKey, setOpenSearch} = useSearchContext();
  const {text} = useI18n();

  if (hideIfDisabled && !enabled) return null;

  return (
    <button
      data-search-full=""
      type="button"
      {...props}
      className={cn(
        "bg-fd-secondary/50 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground inline-flex items-center gap-2 rounded-lg border p-1.5 ps-2 text-sm transition-colors",
        props.className,
      )}
      onClick={() => {
        setOpenSearch(true);
      }}
    >
      <Search className="size-4" />
      {text.search}
      <div className="ms-auto inline-flex gap-0.5">
        {hotKey.map((k, i) => (
          <Kbd key={i}>{k.display}</Kbd>
        ))}
      </div>
    </button>
  );
}
