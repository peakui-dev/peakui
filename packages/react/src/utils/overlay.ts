import type {SurfaceVariants} from "@peakui/styles";

/** The screen edge an edge-anchored overlay (Drawer, Sheet) attaches to. */
export type EdgePlacement = "top" | "bottom" | "left" | "right";

/** The surface variant a dialog-like overlay provides to the controls inside it. */
export const DIALOG_SURFACE_CONTEXT = {variant: "default" as SurfaceVariants["variant"]};
