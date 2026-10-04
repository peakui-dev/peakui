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
/**
 * WCAG 2.2 SC 1.4.11 asks 3:1 of visual information that IDENTIFIES a component or its state.
 * A focus indicator is exactly that. Decorative hairlines — `border`, `separator` and their
 * -secondary/-tertiary levels — are not, and forcing 3:1 on them would put a heavy outline on every
 * card; the reference sits at the same ~1.2:1 for that reason. See the ruling in the spec.
 */
const BOUNDARY_MIN = 3;

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
    // Chosen against the LEAST favourable background in the set, not against `background`.
    // 0.5517 (the reference's value) gives 4.42:1 even on `background`; 0.545 passed there but sat
    // at 3.79:1 on `background-tertiary`. 0.49 clears 4.5:1 on every background the set declares.
    muted: 0.49,
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
  "surface",
  "surface-secondary",
  "surface-tertiary",
  "overlay",
  "default",
  "accent",
  "success",
  "warning",
  "danger",
  "segment",
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

  // `muted` is secondary text and appears on every background in the set, so it is measured
  // against the LEAST favourable of them. Checking only `background` certified it at 4.55:1 while
  // it sat at 4.15:1 on `background-secondary` and 3.79:1 on `background-tertiary`.
  raw["background-secondary"] = mix(c.background, 96, c.foreground, 4);
  raw["background-tertiary"] = mix(c.background, 92, c.foreground, 8);

  const mutedBackgrounds = [
    c.background,
    raw["background-secondary"]!,
    raw["background-tertiary"]!,
    c.surface,
    c.surfaceSecondary,
    c.surfaceTertiary,
    c.default,
    c.overlay,
  ];
  const worstForMuted = mutedBackgrounds.reduce((worst, candidate) =>
    contrastRatio(c.muted, candidate) < contrastRatio(c.muted, worst) ? candidate : worst,
  );
  const mutedFixed = ensureContrast({
    token: "muted",
    fg: c.muted,
    bg: worstForMuted,
    min: TEXT_MIN,
  });

  raw["muted"] = mutedFixed.color;
  if (mutedFixed.fix) fixes.push(mutedFixed.fix);
  raw["field-placeholder"] = raw["muted"]!;

  const fg = (name: string): Oklch => raw[`${name}-foreground`] ?? raw["foreground"]!;
  const soft = scheme === "light" ? 15 : 12;
  const softHover = scheme === "light" ? 20 : 16;
  /*
   * Подмешивание для заливки on-surface. Числа выбраны не на вкус: они воспроизводят отношение
   * `default` к `background` — 1.09:1 в светлой схеме и 1.36:1 в тёмной. Светлые фоны стоят близко
   * друг к другу, тёмные далеко, поэтому процент на схему разный.
   */
  const onSurface = scheme === "light" ? 4 : 12;

  // Calculated set — every percentage from the spec's derivation table.
  raw["surface-hover"] = mix(c.surface, 92, fg("surface"), 8);

  /*
   * Семья on-surface: `default`, перевыведенный против каждого уровня поверхности. Контрол внутри
   * карточки обязан брать заливку, посчитанную относительно карточки, а не относительно страницы —
   * `surface-hover` выше считается только против `surface`, и на втором с третьим уровнях он
   * применялся бы из чужого расчёта.
   *
   * Имена НЕ добавлены в FOREGROUND_PAIRS осознанно: тот цикл идёт выше по файлу и читает raw[name],
   * которого здесь ещё не существует. Текст выводится явным ensureContrast, а покрытие гейтом всё
   * равно есть — он перебирает ключи набора, а не список пар.
   *
   * Трёх `-focus` тут нет: кольцо фокуса в тёмной теме не дотягивает 3:1 уже на `surface-secondary`
   * (2.66:1) и `surface-tertiary` (2.54:1), и это существующий дефект вывода `focus`, а не наш.
   * Замеры и причина отсрочки — спека 2026-10-03-on-surface-tokens-design.md, раздел 6.
   */
  for (const level of ["surface", "surface-secondary", "surface-tertiary"] as const) {
    const suffix = level === "surface" ? "" : level.slice("surface".length);
    const levelFg = fg(level);
    const fill = mix(raw[level]!, 100 - onSurface, levelFg, onSurface);

    raw[`on-surface${suffix}`] = fill;

    const {color, fix} = ensureContrast({
      token: `on-surface${suffix}-foreground`,
      fg: levelFg,
      bg: compositeOver(fill, c.background),
      min: TEXT_MIN,
    });

    raw[`on-surface${suffix}-foreground`] = color;
    if (fix) fixes.push(fix);

    // Тот же 4-процентный шаг, которым выведен default-hover: on-surface и есть default.
    raw[`on-surface${suffix}-hover`] = mix(fill, 96, levelFg, 4);
  }
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

  raw["warning-soft-foreground"] = mix(c.warning, 80, c.foreground, scheme === "light" ? 70 : 30);
  raw["success-soft-foreground"] = mix(c.success, 80, c.foreground, scheme === "light" ? 60 : 30);

  raw["separator-secondary"] = mix(c.surface, 85, fg("surface"), 15);
  raw["separator-tertiary"] = mix(c.surface, 81, fg("surface"), 19);
  raw["border-secondary"] = mix(c.surface, 78, fg("surface"), 22);
  raw["border-tertiary"] = mix(c.surface, 66, fg("surface"), 34);

  raw["field-hover"] = mix(c.field, 90, raw["field-foreground"]!, 2);
  // The spec's table names `field-border` as the base here, but `--field-border` is `transparent`
  // by default, so mixing against it yields a ~0.1-alpha hairline rather than a visible edge.
  // `border` is the meaningful base; the spec table is amended to match.
  raw["field-focus"] = c.field;
  raw["field-border-hover"] = mix(c.border, 88, raw["field-foreground"]!, 10);
  raw["field-border-focus"] = mix(c.border, 74, raw["field-foreground"]!, 22);
  raw["scrollbar-thumb"] = mix(c.foreground, 15, TRANSPARENT, 85);

  /*
   * Final guarantee pass.
   *
   * The work list is derived from the token map, not hand-written: EVERY `X-foreground` is measured
   * against its `X`. The earlier hand-written list silently excluded every `*-soft-foreground`, so a
   * one-field preset could ship Chip/Badge/Alert text at 4.12:1 with the build reporting a clean
   * palette.
   *
   * A translucent `X` is composited first, over both `surface` and `background`, and the worse of
   * the two is what must hold — a soft badge sits on either.
   */
  for (const name of Object.keys(raw)) {
    if (!name.endsWith("-foreground")) continue;

    const partner = raw[name.replace(/-foreground$/, "")];

    if (!partner) continue;

    const bases = [c.surface, c.background];
    const worst = bases.reduce(
      (acc, base) => {
        const composited = compositeOver(partner, base);

        return contrastRatio(raw[name]!, composited) < contrastRatio(raw[name]!, acc)
          ? composited
          : acc;
      },
      compositeOver(partner, c.surface),
    );

    const {color, fix} = ensureContrast({token: name, fg: raw[name]!, bg: worst, min: TEXT_MIN});

    raw[name] = color;
    if (fix) fixes.push(fix);
  }

  // Focus is a state indicator, so the boundary floor applies to it.
  for (const against of [c.background, c.surface]) {
    const {color, fix} = ensureContrast({
      token: "focus",
      fg: raw["focus"]!,
      bg: against,
      min: BOUNDARY_MIN,
    });

    raw["focus"] = color;
    if (fix) fixes.push(fix);
  }

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
  // No inversion is derived: without `darkAccent` the dark scheme reuses the light accent verbatim,
  // which is what the reference does too. `darkAccent` is the ONLY mechanism, not a fallback for one.
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
    /*
     * The value is the Skeleton variant the theme defaults to (shimmer | pulse | none). The
     * reference theme documents the same contract for the same variable; a value outside the
     * variant set resolves to no modifier at all, silently disabling the animation.
     */
    "skeleton-animation": "shimmer",
    "tooltip-delay": "1500ms",
    "tooltip-close-delay": "500ms",
    sans: (preset.typography?.sans ?? DEFAULT_SANS).join(", "),
    mono: (preset.typography?.mono ?? DEFAULT_MONO).join(", "),
  };

  return {
    invariant,
    light: light.tokens,
    dark: dark.tokens,
    fixes: [...light.fixes, ...dark.fixes],
  };
}
