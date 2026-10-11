import type {ThemePreset} from "../src/generator/preset.ts";

/**
 * The core theme.
 *
 * `accent` is the one value a designer is expected to replace. Changing it is a one-line edit —
 * that is the point of generating themes rather than authoring them.
 *
 * The lightness is not a matter of taste. It is squeezed from both sides: from L 0.565 up the
 * light foreground no longer reaches 4.5:1 without a contrast fix, and from L 0.545 down the focus
 * ring drops below 3:1 on the deepest dark surface. 0.555 gives the foreground 4.66:1 and keeps the
 * ring at 3.02:1 or better on every surface level in both schemes.
 *
 * The radius sits on the scale's top step on purpose: the reference's pill-button identity is the
 * default look, and since controls consume the scale at 1x, the pill is reachable only here — the
 * knob's lower steps stay visually distinct instead of saturating (see components/*.css).
 */
export const defaultPreset: ThemePreset = {
  id: "default",
  accent: "oklch(0.555 0.215 262)",
  grayChroma: 0.006,
  radius: "extra-large",
  formRadius: "large",
};
