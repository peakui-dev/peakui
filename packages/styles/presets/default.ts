import type {ThemePreset} from "../src/generator/preset.ts";

/**
 * The core theme.
 *
 * `accent` is the one value a designer is expected to replace. Changing it is a one-line edit —
 * that is the point of generating themes rather than authoring them.
 *
 * The lightness is not a matter of taste: at c=0.20 the band L 0.56–0.60 is a dead zone where
 * neither a light nor a dark foreground reaches 4.5:1. Below it a light foreground wins, above it a
 * dark one. 0.52 gives white text 5.5:1.
 */
export const defaultPreset: ThemePreset = {
  id: "default",
  accent: "oklch(0.52 0.20 275)",
  grayChroma: 0.006,
  radius: "medium",
  formRadius: "large",
};
