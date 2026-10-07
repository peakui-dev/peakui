"use client";

import type {ComponentProps} from "react";

import {SegmentedControl} from "@peakui/react";
import {useTheme} from "next-themes";

import {Airplay, Moon, Sun} from "@/components/fumadocs/ui/icons";
import {useIsMounted} from "@/hooks/use-is-mounted";

/*
 * The control is peakui's SegmentedControl; the theme wiring is unchanged. Both modes are now the
 * same shape — N segments with one selected — so `light-dark` gained the sliding capsule it never
 * had, and the hand-written pill and its conditional icon classes are gone with it.
 *
 * Before mount there is no resolved theme to show, so no segment is selected: rendering one would
 * guess, and the guess would be wrong half the time and then flip after hydration.
 */
const SEGMENTS = {
  "light-dark": [
    ["light", Sun, "Light"],
    ["dark", Moon, "Dark"],
  ],
  "light-dark-system": [
    ["light", Sun, "Light"],
    ["dark", Moon, "Dark"],
    ["system", Airplay, "System"],
  ],
} as const;

export function ThemeToggle({
  className,
  mode = "light-dark",
  ...props
}: Omit<ComponentProps<typeof SegmentedControl>, "children"> & {
  mode?: "light-dark" | "light-dark-system";
}) {
  const {resolvedTheme, setTheme, theme} = useTheme();
  const mounted = useIsMounted();

  /*
   * `light-dark` flips the resolved theme, so "system" must collapse to what it resolved to;
   * `light-dark-system` offers the stored preference itself, where "system" is a choice.
   */
  const value = mounted ? (mode === "light-dark" ? resolvedTheme : theme) : undefined;

  return (
    <SegmentedControl
      aria-label="Theme"
      className={className}
      data-theme-toggle=""
      selectedKey={value}
      size="md"
      onSelectionChange={(key) => setTheme(String(key))}
      {...props}
    >
      {SEGMENTS[mode].map(([key, Icon, label]) => (
        <SegmentedControl.Item key={key} aria-label={label} id={key}>
          <Icon fill="currentColor" />
        </SegmentedControl.Item>
      ))}
    </SegmentedControl>
  );
}
