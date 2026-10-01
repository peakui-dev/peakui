/**
 * Preset → full token sets.
 *
 * Every percentage below comes from the spec's "Таблица вывода"; none is invented here. Contrast is
 * enforced as the final stage, so a set that leaves this function is guaranteed to meet the floors.
 */

import type {Oklch} from "./color.ts";
import type {ContrastFix} from "./contrast.ts";
import type {Scheme, SemanticSet, ThemePreset, TokenSet} from "./preset.ts";

import {contrastRatio, formatOklch, parseOklch} from "./color.ts";
import {TRANSPARENT, compositeOver, ensureContrast, mix} from "./contrast.ts";
import {RADIUS_BASE} from "./preset.ts";

const TEXT_MIN = 4.5;

const DEFAULT_SANS = ["Inter", "system-ui", "sans-serif"];
const DEFAULT_MONO = ["JetBrains Mono", "ui-monospace", "monospace"];

/** Status hues are fixed: a brand changes them through `semanticOverrides`, not by accident. */
const HUE = {success: 150, warning: 75, danger: 27};

/** Lightness anchors per scheme. Names and roles follow HeroUI v3 1:1; the values are ours. */
const ANCHOR = {
  light: {
    background: 0.9702,
    foreground: 0.2103,
    surface: 1,
    surfaceSecondary: 0.9524,
    surfaceTertiary: 0.9373,
    overlay: 1,
    // 0.545, not 0.5517: at 0.5517 muted text lands at 4.42:1 on this background, just under AA.
    muted: 0.545,
    default: 0.94,
    segment: 1,
    border: 0.9,
    separator: 0.92,
    field: 1,
    // Status anchors avoid the L 0.56-0.60 dead zone, where neither a light nor a dark foreground
    // reaches 4.5:1. Below it a light foreground wins; above it a dark one does.
    success: 0.7,
    warning: 0.8,
    danger: 0.52,
    backdropAlpha: 0.5,
  },
  dark: {
    background: 0.12,
    foreground: 0.9911,
    surface: 0.2103,
    surfaceSecondary: 0.257,
    surfaceTertiary: 0.2721,
    overlay: 0.2103,
    muted: 0.705,
    default: 0.274,
    segment: 0.3964,
    border: 0.28,
    separator: 0.25,
    field: 0.2103,
    success: 0.7,
    warning: 0.8,
    danger: 0.52,
    backdropAlpha: 0.6,
  },
} as const;

const must = (value: string, what: string): Oklch => {
  const parsed = parseOklch(value);

  if (!parsed) throw new Error(`Не удалось разобрать ${what}: «${value}». Ожидается oklch(...).`);

  return parsed;
};

/**
 * Picks the readable foreground for a background by measuring both candidates rather than
 * thresholding lightness. Each carries a trace of the background's hue, so text on a coloured
 * surface reads as part of the palette instead of as neutral grey dropped on top.
 */
const pickForeground = (bg: Oklch): Oklch => {
  const light: Oklch = {l: 0.98, c: Math.min(bg.c * 0.1, 0.02), h: bg.h, a: 1};
  const dark: Oklch = {l: 0.15, c: Math.min(bg.c * 0.3, 0.05), h: bg.h, a: 1};

  return contrastRatio(light, bg) >= contrastRatio(dark, bg) ? light : dark;
};

type SchemeColors = {
  background: Oklch;
  foreground: Oklch;
  surface: Oklch;
  surfaceSecondary: Oklch;
  surfaceTertiary: Oklch;
  overlay: Oklch;
  muted: Oklch;
  default: Oklch;
  segment: Oklch;
  border: Oklch;
  separator: Oklch;
  field: Oklch;
  accent: Oklch;
  success: Oklch;
  warning: Oklch;
  danger: Oklch;
};

const buildScheme = (
  scheme: Scheme,
  accent: Oklch,
  grayChroma: number,
  overrides: SemanticSet | undefined,
): SchemeColors => {
  const a = ANCHOR[scheme];
  /** Neutrals carry the accent's hue, so the greys belong to the palette. */
  const neutral = (l: number): Oklch => ({l, c: grayChroma, h: accent.h, a: 1});
  const status = (key: "success" | "warning" | "danger"): Oklch => {
    const override = overrides?.[key]?.color;

    return override ? must(override, key) : {l: a[key], c: 0.17, h: HUE[key], a: 1};
  };

  return {
    background: neutral(a.background),
    foreground: neutral(a.foreground),
    surface: neutral(a.surface),
    surfaceSecondary: neutral(a.surfaceSecondary),
    surfaceTertiary: neutral(a.surfaceTertiary),
    overlay: neutral(a.overlay),
    muted: neutral(a.muted),
    default: neutral(a.default),
    segment: neutral(a.segment),
    border: neutral(a.border),
    separator: neutral(a.separator),
    field: neutral(a.field),
    accent,
    success: status("success"),
    warning: status("warning"),
    danger: status("danger"),
  };
};

/** `X` and its `X-foreground`, in the order they are enforced. */
const FOREGROUND_PAIRS = [
  "surface", "surface-secondary", "surface-tertiary", "overlay", "default",
  "accent", "success", "warning", "danger", "segment",
] as const;

const deriveScheme = (
  scheme: Scheme,
  colors: SchemeColors,
  overrides: SemanticSet | undefined,
): {tokens: TokenSet; fixes: ContrastFix[]} => {
  const a = ANCHOR[scheme];
  const c = colors;
  const fixes: ContrastFix[] = [];
  const raw: Record<string, Oklch> = {};

  raw["background"] = c.background;
  raw["foreground"] = c.foreground;
  raw["surface"] = c.surface;
  raw["surface-secondary"] = c.surfaceSecondary;
  raw["surface-tertiary"] = c.surfaceTertiary;
  raw["overlay"] = c.overlay;
  raw["muted"] = c.muted;
  raw["default"] = c.default;
  raw["segment"] = c.segment;
  raw["border"] = c.border;
  raw["separator"] = c.separator;
  raw["accent"] = c.accent;
  raw["success"] = c.success;
  raw["warning"] = c.warning;
  raw["danger"] = c.danger;
  raw["focus"] = c.accent;
  raw["link"] = c.foreground;
  raw["field-background"] = c.field;
  raw["field-placeholder"] = c.muted;
  raw["backdrop"] = {l: 0, c: 0, h: 0, a: a.backdropAlpha};

  // Foregrounds: measured, then guaranteed.
  for (const name of FOREGROUND_PAIRS) {
    const bg = raw[name]!;
    const override =
      name === "accent"
        ? overrides?.accentForeground
        : name === "success" || name === "warning" || name === "danger"
          ? overrides?.[name]?.foreground
          : undefined;
    const candidate = override ? must(override, `${name}-foreground`) : pickForeground(bg);
    const {color, fix} = ensureContrast({
      token: `${name}-foreground`,
      fg: candidate,
      bg: compositeOver(bg, c.background),
      min: TEXT_MIN,
    });

    raw[`${name}-foreground`] = color;
    if (fix) fixes.push(fix);
  }

  raw["field-foreground"] = raw["surface-foreground"]!;

  // `muted` is secondary text, so AA applies to it too, measured against the scheme background.
  const mutedFixed = ensureContrast({
    token: "muted",
    fg: c.muted,
    bg: c.background,
    min: TEXT_MIN,
  });

  raw["muted"] = mutedFixed.color;
  if (mutedFixed.fix) fixes.push(mutedFixed.fix);
  raw["field-placeholder"] = raw["muted"]!;

  const fg = (name: string): Oklch => raw[`${name}-foreground`] ?? raw["foreground"]!;
  const soft = scheme === "light" ? 15 : 12;
  const softHover = scheme === "light" ? 20 : 16;

  // Calculated set — every percentage from the spec's derivation table.
  raw["surface-hover"] = mix(c.surface, 92, fg("surface"), 8);
  raw["background-secondary"] = mix(c.background, 96, c.foreground, 4);
  raw["background-tertiary"] = mix(c.background, 92, c.foreground, 8);
  raw["background-inverse"] = c.foreground;
  raw["default-hover"] = mix(c.default, 96, fg("default"), 4);

  for (const key of ["accent", "success", "warning", "danger"] as const) {
    raw[`${key}-hover`] = mix(raw[key]!, 90, fg(key), 10);
  }

  raw["default-soft"] = mix(c.default, 50, TRANSPARENT, 50);
  raw["default-soft-foreground"] = fg("default");
  raw["default-soft-hover"] = mix(c.default, 60, TRANSPARENT, 40);

  raw["accent-soft"] = mix(c.accent, soft, TRANSPARENT, 100 - soft);
  raw["accent-soft-hover"] = mix(c.accent, softHover, TRANSPARENT, 100 - softHover);
  raw["accent-soft-foreground"] = mix(
    c.accent,
    scheme === "light" ? 70 : 80,
    c.foreground,
    scheme === "light" ? 30 : 30,
  );

  raw["danger-soft"] = mix(c.danger, 15, TRANSPARENT, 85);
  raw["danger-soft-hover"] = mix(c.danger, 20, TRANSPARENT, 80);
  raw["danger-soft-foreground"] = mix(
    c.danger,
    scheme === "light" ? 70 : 80,
    c.foreground,
    scheme === "light" ? 40 : 30,
  );

  for (const key of ["warning", "success"] as const) {
    raw[`${key}-soft`] = mix(raw[key]!, soft, TRANSPARENT, 100 - soft);
    raw[`${key}-soft-hover`] = mix(raw[key]!, softHover, TRANSPARENT, 100 - softHover);
  }

  raw["warning-soft-foreground"] = mix(
    c.warning,
    80,
    c.foreground,
    scheme === "light" ? 70 : 30,
  );
  raw["success-soft-foreground"] = mix(
    c.success,
    80,
    c.foreground,
    scheme === "light" ? 60 : 30,
  );

  raw["separator-secondary"] = mix(c.surface, 85, fg("surface"), 15);
  raw["separator-tertiary"] = mix(c.surface, 81, fg("surface"), 19);
  raw["border-secondary"] = mix(c.surface, 78, fg("surface"), 22);
  raw["border-tertiary"] = mix(c.surface, 66, fg("surface"), 34);

  raw["field-hover"] = mix(c.field, 90, raw["field-foreground"]!, 2);
  raw["field-focus"] = c.field;
  raw["field-border-hover"] = mix(c.border, 88, raw["field-foreground"]!, 10);
  raw["field-border-focus"] = mix(c.border, 74, raw["field-foreground"]!, 22);
  raw["scrollbar-thumb"] = mix(c.foreground, 15, TRANSPARENT, 85);

  const tokens: TokenSet = {};

  for (const [name, color] of Object.entries(raw)) tokens[name] = formatOklch(color);

  // Non-colour members of the scheme.
  tokens["field-border"] = "transparent";
  tokens["scrollbar"] = "var(--scrollbar-thumb)";
  tokens["scrollbar-track"] = "transparent";
  tokens["scrollbar-color"] = "var(--scrollbar-thumb) var(--scrollbar-track)";
  tokens["scrollbar-width"] = "thin";
  tokens["scrollbar-gutter"] = "auto";

  if (scheme === "light") {
    tokens["surface-shadow"] =
      "0 2px 4px 0 oklch(0 0 0 / 0.04), 0 1px 2px 0 oklch(0 0 0 / 0.06), 0 0 1px 0 oklch(0 0 0 / 0.06)";
    tokens["overlay-shadow"] =
      "0 2px 8px 0 oklch(0 0 0 / 0.06), 0 -6px 12px 0 oklch(0 0 0 / 0.03), 0 14px 28px 0 oklch(0 0 0 / 0.08)";
    tokens["field-shadow"] = tokens["surface-shadow"];
  } else {
    // Shadows do not read on a dark surface; an inset hairline does.
    tokens["surface-shadow"] = "0 0 0 0 transparent inset";
    tokens["overlay-shadow"] = "0 0 1px 0 oklch(1 0 0 / 0.3) inset";
    tokens["field-shadow"] = "0 0 0 0 transparent inset";
  }

  return {tokens, fixes};
};

export function deriveTheme(preset: ThemePreset): {
  invariant: TokenSet;
  light: TokenSet;
  dark: TokenSet;
  fixes: ContrastFix[];
} {
  const accent = must(preset.accent, "accent");
  const darkAccent = preset.darkAccent ? must(preset.darkAccent, "darkAccent") : accent;

  const light = deriveScheme(
    "light",
    buildScheme("light", accent, preset.grayChroma, preset.semanticOverrides?.light),
    preset.semanticOverrides?.light,
  );
  const dark = deriveScheme(
    "dark",
    buildScheme("dark", darkAccent, preset.grayChroma, preset.semanticOverrides?.dark),
    preset.semanticOverrides?.dark,
  );

  const invariant: TokenSet = {
    white: "oklch(100% 0 0)",
    black: "oklch(0% 0 0)",
    spacing: "0.25rem",
    "border-width": "1px",
    "field-border-width": "0px",
    "disabled-opacity": "0.5",
    "ring-offset-width": "2px",
    "cursor-interactive": "pointer",
    "cursor-disabled": "not-allowed",
    radius: RADIUS_BASE[preset.radius],
    "field-radius": RADIUS_BASE[preset.formRadius],
    "skeleton-animation": "shimmer",
    "tooltip-delay": "1500ms",
    "tooltip-close-delay": "500ms",
    sans: (preset.typography?.sans ?? DEFAULT_SANS).join(", "),
    mono: (preset.typography?.mono ?? DEFAULT_MONO).join(", "),
  };

  return {invariant, light: light.tokens, dark: dark.tokens, fixes: [...light.fixes, ...dark.fixes]};
}
