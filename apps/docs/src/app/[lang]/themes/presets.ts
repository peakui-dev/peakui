import type {RadiusId, ThemePreset} from "@peakui/styles/generator";

/** What the builder edits: a ThemePreset minus identity, plus nothing else. */
export type BuilderValues = {
  accent: string;
  grayChroma: number;
  radius: RadiusId;
  formRadius: RadiusId;
  /** Explicitly assignable as undefined, so a preset click can clear a stale value. */
  darkAccent?: string | undefined;
};

/** The preview derives one theme under this id; the export uses the user's own id. */
export const BUILDER_THEME_ID = "builder";

/** The engine's default theme as builder values — the reset target. Mirrors presets/default.ts. */
export const DEFAULT_VALUES: BuilderValues = {
  accent: "oklch(0.555 0.215 262)",
  grayChroma: 0.006,
  radius: "extra-large",
  formRadius: "large",
};

export type GalleryPreset = {
  name: string;
  values: BuilderValues;
  semanticOverrides?: ThemePreset["semanticOverrides"];
};

/*
 * Editor inputs, not shipped themes: picking one writes its values into the URL, nothing is
 * added to @peakui/styles (spec, "Boundaries").
 */
export const GALLERY: GalleryPreset[] = [
  // PeakUI's own palettes first, the brand-inspired ones after: the picker shows them as two rows.
  {name: "Default", values: DEFAULT_VALUES},
  {
    name: "Mint",
    values: {
      accent: "oklch(0.68 0.14 165)",
      grayChroma: 0.01,
      radius: "large",
      formRadius: "extra-large",
    },
  },
  {
    name: "Lavender",
    values: {
      accent: "oklch(0.62 0.17 300)",
      grayChroma: 0.012,
      radius: "medium",
      formRadius: "large",
    },
  },
  {
    name: "Graphite",
    values: {
      accent: "#18181b",
      darkAccent: "#e4e4e7",
      grayChroma: 0.003,
      radius: "small",
      formRadius: "small",
    },
  },
  {
    name: "Spotify",
    values: {accent: "#1db954", grayChroma: 0.008, radius: "medium", formRadius: "large"},
  },
  {
    name: "Netflix",
    values: {accent: "#e50914", grayChroma: 0.005, radius: "small", formRadius: "small"},
    semanticOverrides: {
      light: {danger: {color: "#e50914"}},
      dark: {danger: {color: "#e50914"}},
    },
  },
  {
    name: "Airbnb",
    values: {accent: "#ff385c", grayChroma: 0.004, radius: "medium", formRadius: "medium"},
  },
  {
    name: "Discord",
    values: {accent: "#5865f2", grayChroma: 0.015, radius: "medium", formRadius: "medium"},
  },
];

export function toPreset(
  values: BuilderValues,
  semanticOverrides?: ThemePreset["semanticOverrides"],
  id: string = BUILDER_THEME_ID,
): ThemePreset {
  return {
    id,
    accent: values.accent,
    grayChroma: values.grayChroma,
    radius: values.radius,
    formRadius: values.formRadius,
    ...(values.darkAccent ? {darkAccent: values.darkAccent} : {}),
    ...(semanticOverrides ? {semanticOverrides} : {}),
  };
}

/**
 * Values → the matching gallery preset, or undefined for a custom theme.
 *
 * The URL stores values only, so a preset's `semanticOverrides` reattach through this match —
 * from a preset click and from a shared link alike.
 */
export function matchGalleryPreset(values: BuilderValues): GalleryPreset | undefined {
  const same = (candidate: BuilderValues): boolean =>
    candidate.accent === values.accent &&
    Math.abs(candidate.grayChroma - values.grayChroma) < 1e-9 &&
    candidate.radius === values.radius &&
    candidate.formRadius === values.formRadius &&
    candidate.darkAccent === values.darkAccent;

  return GALLERY.find((preset) => same(preset.values));
}
