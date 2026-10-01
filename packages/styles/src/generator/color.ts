/**
 * OKLCH colour maths and WCAG contrast.
 *
 * Colours are declared in OKLCH throughout the design system; sRGB appears here only because
 * WCAG relative luminance is defined on it. No colour library: the conversion is forty lines,
 * and a dependency in the token pipeline would be a liability.
 */

export type Oklch = {l: number; c: number; h: number; a: number};

const OKLCH_PATTERN =
  /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+|none)\s*(?:\/\s*([\d.]+)(%?)\s*)?\)$/i;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** Rounds to 4 decimals and drops trailing zeros, so 0.5 stays `0.5`. */
const round4 = (value: number): number => Number(value.toFixed(4));

export function parseOklch(value: string): Oklch | null {
  const match = OKLCH_PATTERN.exec(value.trim());

  if (!match) return null;

  const [, rawL, lPercent, rawC, rawH, rawA, aPercent] = match;

  // `none` is a valid hue for an achromatic colour; parseFloat would yield NaN and poison
  // every ratio computed downstream.
  const h = rawH === "none" ? 0 : Number(rawH);
  const l = lPercent === "%" ? Number(rawL) / 100 : Number(rawL);
  const a =
    rawA === undefined ? 1 : aPercent === "%" ? Number(rawA) / 100 : Number(rawA);

  return {l, c: Number(rawC), h, a};
}

export function formatOklch(color: Oklch): string {
  const base = `oklch(${round4(color.l)} ${round4(color.c)} ${round4(color.h)}`;

  return color.a === 1 ? `${base})` : `${base} / ${round4(color.a)})`;
}

/**
 * OKLCH → linear sRGB (Ottosson). Channels are clamped to [0,1]: a high-chroma colour sits
 * outside the sRGB gamut, and unclamped components make relative luminance leave [0,1] and
 * every contrast ratio built on it wrong.
 */
export function oklchToLinearSrgb(color: Oklch): {r: number; g: number; b: number} {
  const radians = (color.h * Math.PI) / 180;
  const a_ = color.c * Math.cos(radians);
  const b_ = color.c * Math.sin(radians);

  const L = color.l + 0.3963377774 * a_ + 0.2158037573 * b_;
  const M = color.l - 0.1055613458 * a_ - 0.0638541728 * b_;
  const S = color.l - 0.0894841775 * a_ - 1.291485548 * b_;

  const l3 = L ** 3;
  const m3 = M ** 3;
  const s3 = S ** 3;

  return {
    r: clamp01(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3),
    g: clamp01(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3),
    b: clamp01(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3),
  };
}

/**
 * WCAG 2.x relative luminance. The sRGB values from `oklchToLinearSrgb` are already linear,
 * so the weights apply directly — gamma-encoding and re-linearising would only add error.
 */
export function relativeLuminance(color: Oklch): number {
  const {r, g, b} = oklchToLinearSrgb(color);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: Oklch, b: Oklch): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);

  return (hi + 0.05) / (lo + 0.05);
}
