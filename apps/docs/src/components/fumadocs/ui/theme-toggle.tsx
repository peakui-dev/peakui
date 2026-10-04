"use client";

import type {ComponentProps} from "react";

import {ToggleButton, ToggleButtonGroup} from "@peakui/react";
import {useTheme} from "next-themes";

import {Airplay, Moon, Sun} from "@/components/fumadocs/ui/icons";
import {useIsMounted} from "@/hooks/use-is-mounted";
import {cn} from "@/utils/cn";

/*
 * The controls are peakui components; the theme wiring is unchanged: `light-dark` is one
 * control that flips the resolved theme, `light-dark-system` offers each theme as its own
 * button. The icon chips of the two-state control stay as plain conditional classes — they
 * are indicators inside one control, not selected styling the component would own.
 */
const itemBase = "text-fd-muted-foreground size-6.5 rounded-full p-1.5";
const itemActive = "bg-fd-accent text-fd-accent-foreground";

const full = [["light", Sun] as const, ["dark", Moon] as const, ["system", Airplay] as const];

export function ThemeToggle({
  className,
  mode = "light-dark",
  ...props
}: ComponentProps<"div"> & {
  mode?: "light-dark" | "light-dark-system";
}) {
  const {resolvedTheme, setTheme, theme} = useTheme();
  const mounted = useIsMounted();

  const container = cn(
    "inline-flex cursor-(--cursor-interactive) items-center rounded-full border p-1",
    className,
  );

  if (mode === "light-dark") {
    const value = mounted ? resolvedTheme : null;

    return (
      <ToggleButton
        aria-label="Toggle Theme"
        className={cn(container, "gap-1")}
        data-theme-toggle=""
        isSelected={value === "dark"}
        onChange={() => setTheme(value === "light" ? "dark" : "light")}
      >
        {full.map(([key, Icon]) => {
          if (key === "system") return;

          return (
            <Icon
              key={key}
              className={cn(itemBase, value === key && itemActive)}
              fill="currentColor"
            />
          );
        })}
      </ToggleButton>
    );
  }

  const value = mounted ? theme : null;

  return (
    <ToggleButtonGroup
      disallowEmptySelection
      isDetached
      aria-label="Select Theme"
      className={container}
      data-theme-toggle=""
      selectedKeys={value ? new Set([value]) : new Set()}
      selectionMode="single"
      onSelectionChange={(keys) => {
        const key = keys.values().next().value;

        if (key !== undefined) setTheme(String(key));
      }}
      {...props}
    >
      {full.map(([key, Icon]) => (
        <ToggleButton key={key} isIconOnly aria-label={key} id={key} size="sm" variant="ghost">
          <Icon fill="currentColor" />
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
