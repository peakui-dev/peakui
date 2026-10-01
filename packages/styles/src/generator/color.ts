/**
 * OKLCH colour maths and WCAG contrast.
 *
 * Colours are declared in OKLCH throughout the design system; sRGB appears here only because
 * WCAG relative luminance is defined on it. No colour library: the conversion is forty lines,
 * and a dependency in the token pipeline would be a liability.
 */

export type Oklch = {l: number; c: number; h: number; a: number};

/** A real number grammar. `[\d.]+` would accept `1.2.3` and yield NaN downstream. */
const NUM = String.raw`[+-]?(?:\d+\.?\d*|\.\d+)`;

const OKLCH_PATTERN = new RegExp(
  String.raw`^oklch\(\s*(${NUM}|none)(%?)\s+(${NUM}|none)\s+(${NUM}|none)(deg)?\s*` +
    String.raw`(?:\/\s*(${NUM}|none)(%?)\s*)?\)$`,
  "i",
);

const HEX_PATTERN = /^#(?:([\da-f]{3})|([\da-f]{6}))$/i;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** Rounds to 4 decimals and drops trailing zeros, so 0.5 stays `0.5`. */
const round4 = (value: number): number => Number(value.toFixed(4));

/** Normalises a hue to [0, 360); `-10` and `350` are the same angle. */
const normalizeHue = (h: number): number => ((h % 360) + 360) % 360;

const srgbToLinearChannel = (value: number): number =>
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

/**
 * Accepts the two formats the preset type advertises: `oklch(...)` and hex.
 *
 * Returns `null` for anything else, including a malformed number — `1.2.3` must not become
 * `NaN`, because a NaN hue emits `oklch(... NaN)`, which a browser drops, leaving an element
 * unstyled with no error anywhere.
 */
export function parseOklch(value: string): Oklch | null {
  const input = value.trim();
  const hex = HEX_PATTERN.exec(input);

  if (hex) {
    const digits = hex[1] ? [...hex[1]].map((d) => d + d).join("") : hex[2]!;
    const channels = [0, 2, 4].map((i) =>
      srgbToLinearChannel(Number.parseInt(digits.slice(i, i + 2), 16) / 255),
    ) as [number, number, number];

    return linearSrgbToOklch(channels[0], channels[1], channels[2]);
  }

  const match = OKLCH_PATTERN.exec(input);

  if (!match) return null;

  const [, rawL, lPercent, rawC, rawH, , rawA, aPercent] = match;

  // `none` is valid in any component of an achromatic colour and means zero.
  const num = (raw: string | undefined, percent: boolean): number => {
    if (raw === undefined || raw.toLowerCase() === "none") return 0;

    return percent ? Number(raw) / 100 : Number(raw);
  };

  const color: Oklch = {
    l: num(rawL, lPercent === "%"),
    c: num(rawC, false),
    h: normalizeHue(num(rawH, false)),
    a: rawA === undefined ? 1 : num(rawA, aPercent === "%"),
  };

  if (![color.l, color.c, color.h, color.a].every(Number.isFinite)) return null;

  return color;
}

/** linear sRGB → OKLCH (Ottosson, the inverse of `oklchToLinearSrgb`). */
export function linearSrgbToOklch(r: number, g: number, b: number): Oklch {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a_ = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const b_ = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  return {
    l: lightness,
    c: Math.hypot(a_, b_),
    h: normalizeHue((Math.atan2(b_, a_) * 180) / Math.PI),
    a: 1,
  };
}

/** Gamma-encodes a linear sRGB channel. CSS composites on these values, not on linear ones. */
export function linearToSrgbChannel(value: number): number {
  const v = Math.min(1, Math.max(0, value));

  return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
}

export {srgbToLinearChannel};

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
