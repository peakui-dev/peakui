/** A theme's authored input. Everything else about a theme is derived from these fields. */

export type RadiusId = "none" | "extra-small" | "small" | "medium" | "large" | "extra-large";

/**
 * `RadiusId` → the value of `--radius`. The whole `--radius-xs…4xl` scale is derived from it by
 * multipliers in `themes/shared/theme.css`, so one field rescales every corner in the system.
 */
export const RADIUS_BASE: Record<RadiusId, string> = {
  none: "0rem",
  "extra-small": "0.125rem",
  small: "0.25rem",
  medium: "0.5rem",
  large: "0.75rem",
  "extra-large": "1rem",
};

/** Exact status colours, for brands whose red or green the derivation cannot guess. */
export type SemanticSet = {
  accentForeground?: string;
  success?: {color: string; foreground?: string};
  warning?: {color: string; foreground?: string};
  danger?: {color: string; foreground?: string};
};

export type ThemePreset = {
  /** The theme's directory and its `data-theme` value. */
  id: string;
  /** hex (`#rgb` / `#rrggbb`) or oklch; decomposed into l/c/h. */
  accent: string;
  /** 0–0.03: how much of the accent's hue the neutrals carry. */
  grayChroma: number;
  radius: RadiusId;
  formRadius: RadiusId;
  /** When the light accent cannot invert on its own — a black or white brand. */
  darkAccent?: string;
  semanticOverrides?: {light?: SemanticSet; dark?: SemanticSet};
  /** Font stacks become `--sans` / `--mono`. The scale and weights are not themeable (see spec §3). */
  typography?: {sans: string[]; mono: string[]};
};

export type Scheme = "light" | "dark";

/** Token name without the leading `--`, mapped to its CSS value. */
export type TokenSet = Record<string, string>;
