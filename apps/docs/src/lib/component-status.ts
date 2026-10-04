import type {ChipProps} from "@peakui/react";

/**
 * Status values a component page may declare in its `icon` frontmatter field. `new-dot` is
 * recognized but renders nothing.
 */
export type ComponentStatus = "new" | "new-dot" | "preview" | "updated";

const STATUS_VALUES: readonly string[] = ["new", "new-dot", "preview", "updated"];

export function isComponentStatus(value: string): value is ComponentStatus {
  return STATUS_VALUES.includes(value);
}

/*
 * The retired hand-rolled badge mapped each status to a palette of its own (an attention tint
 * for "new", an outline for "preview", a faint fill for "updated"). Chip ships no such variants,
 * so the mapping lives here — shared by the call sites — instead of forking the component.
 */
export function statusChipProps(
  status: ComponentStatus,
): (Pick<ChipProps, "color" | "variant"> & {children: string}) | undefined {
  switch (status) {
    case "new":
      return {children: "New", color: "accent", variant: "soft"};
    case "preview":
      return {children: "Preview", color: "default", variant: "tertiary"};
    case "updated":
      return {children: "Updated", color: "default", variant: "secondary"};
    default:
      return undefined;
  }
}
