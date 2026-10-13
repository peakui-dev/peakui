import type {TokenSet} from "@peakui/styles/generator";

import {compositeOver, contrastRatio, parseOklch} from "@peakui/styles/generator";

export type ContrastPair = {
  label: string;
  /** "text" paints `fg` as type on `bg`; "ring" paints it as the focus ring around `bg`. */
  kind: "text" | "ring";
  fg: string;
  bg: string;
  /** The floor the engine enforces for the pair. */
  min: number;
};

/** The pairs a visitor meets first; the engine guarantees every `X-foreground`, not only these. */
export const CONTRAST_PAIRS: ContrastPair[] = [
  {label: "Text", kind: "text", fg: "foreground", bg: "background", min: 4.5},
  {label: "Muted text", kind: "text", fg: "muted", bg: "background", min: 4.5},
  {label: "On accent", kind: "text", fg: "accent-foreground", bg: "accent", min: 4.5},
  {
    label: "On soft accent",
    kind: "text",
    fg: "accent-soft-foreground",
    bg: "accent-soft",
    min: 4.5,
  },
  {label: "On danger", kind: "text", fg: "danger-foreground", bg: "danger", min: 4.5},
  {label: "Focus ring", kind: "ring", fg: "focus", bg: "background", min: 3},
];

export type MeasuredPair = ContrastPair & {ratio: number};

/**
 * The pairs' ratios, measured the way the engine measures them: a translucent fill is flattened
 * onto the surface and onto the page, and the worse of the two is the ratio that counts.
 */
export function measureContrast(tokens: TokenSet): MeasuredPair[] {
  const color = (name: string) => parseOklch(tokens[name] ?? "");
  const bases = [color("surface"), color("background")].filter((base) => base !== null);

  return CONTRAST_PAIRS.flatMap((pair) => {
    const fg = color(pair.fg);
    const bg = color(pair.bg);

    if (!fg || !bg || bases.length === 0) return [];

    const ratio = Math.min(...bases.map((base) => contrastRatio(fg, compositeOver(bg, base))));

    return [{...pair, ratio}];
  });
}
