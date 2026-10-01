/**
 * Colour mixing, alpha compositing and the contrast guarantee.
 *
 * Mixing happens in OKLab, matching `color-mix(in oklab, ...)` in the emitted CSS, so a token
 * computed here and the same declaration evaluated by a browser agree.
 */

import type {Oklch} from "./color";

import {contrastRatio} from "./color";

/** CSS `transparent` is `rgb(0 0 0 / 0)`. */
export const TRANSPARENT: Oklch = {l: 0, c: 0, h: 0, a: 0};

const LIGHTNESS_STEP = 0.01;
/** 100 steps of 0.01 span the whole lightness range, so the search can always reach either end. */
const MAX_STEPS = 100;

type Oklab = {l: number; a: number; b: number; alpha: number};

const toOklab = (color: Oklch): Oklab => {
  const radians = (color.h * Math.PI) / 180;

  return {
    l: color.l,
    a: color.c * Math.cos(radians),
    b: color.c * Math.sin(radians),
    alpha: color.a,
  };
};

const toOklch = (lab: Oklab): Oklch => {
  const degrees = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
  const normalized = ((degrees % 360) + 360) % 360;

  return {
    l: lab.l,
    c: Math.hypot(lab.a, lab.b),
    // Hue is modular, and floating-point noise turns an angle of -1e-17 into 359.99999999.
    // That is the same angle as 0; snapping keeps emitted CSS from carrying a spurious 360.
    h: normalized > 360 - 1e-6 ? 0 : normalized,
    a: lab.alpha,
  };
};

/**
 * `color-mix(in oklab, a pa%, b pb%)`.
 *
 * Weights are normalised by their sum, because CSS does: the spec's `field-hover` is
 * `mix(field-bg 90, field-fg 2)`, and a naive `pa / 100` would emit a colour no browser produces.
 *
 * Interpolation is premultiplied, again matching CSS. That is what makes mixing with
 * `transparent` lower the alpha while leaving the colour alone — `accent-soft` is the accent at
 * alpha 0.15, not a pale accent.
 */
export function mix(a: Oklch, pa: number, b: Oklch, pb: number): Oklch {
  const total = pa + pb;

  if (total === 0) return TRANSPARENT;

  const wa = pa / total;
  const wb = pb / total;

  const la = toOklab(a);
  const lb = toOklab(b);

  const alpha = wa * la.alpha + wb * lb.alpha;

  if (alpha === 0) return TRANSPARENT;

  return toOklch({
    l: (wa * la.l * la.alpha + wb * lb.l * lb.alpha) / alpha,
    a: (wa * la.a * la.alpha + wb * lb.a * lb.alpha) / alpha,
    b: (wa * la.b * la.alpha + wb * lb.b * lb.alpha) / alpha,
    alpha,
  });
}

/**
 * Flattens a translucent colour onto an opaque background.
 *
 * A soft token's contrast cannot be measured directly: `accent-soft` is alpha 0.15, so what a
 * person sees is it composited over whatever sits behind. Measuring the raw token reports a ratio
 * nobody experiences.
 */
export function compositeOver(fg: Oklch, bg: Oklch): Oklch {
  if (fg.a === 1) return fg;

  const f = toOklab(fg);
  const b = toOklab(bg);
  const weight = fg.a;

  return toOklch({
    l: f.l * weight + b.l * (1 - weight),
    a: f.a * weight + b.a * (1 - weight),
    b: f.b * weight + b.b * (1 - weight),
    alpha: 1,
  });
}

export type ContrastFix = {token: string; from: number; to: number; ratio: number};

/**
 * Guarantees a foreground meets `min` against its background, adjusting lightness only.
 *
 * Chroma and hue are never touched, so a corrected colour keeps the palette's character. Every
 * adjustment is reported rather than applied silently: a palette that quietly moves underneath the
 * designer is worse than one that fails loudly.
 */
export function ensureContrast(args: {
  token: string;
  fg: Oklch;
  bg: Oklch;
  min: number;
}): {color: Oklch; fix?: ContrastFix} {
  const {token, fg, bg, min} = args;

  if (contrastRatio(fg, bg) >= min) return {color: fg};

  let best = contrastRatio(fg, bg);
  let winner: {l: number; ratio: number; steps: number} | undefined;

  // Both directions are tried. Picking one from the background's lightness fails exactly where it
  // matters: against a mid-toned background, lighter and darker text can both pass, and which one
  // does is not predictable from the background alone.
  for (const direction of [1, -1] as const) {
    for (let step = 1; step <= MAX_STEPS; step += 1) {
      const l = Math.min(1, Math.max(0, fg.l + direction * LIGHTNESS_STEP * step));
      const ratio = contrastRatio({...fg, l}, bg);

      best = Math.max(best, ratio);

      if (ratio >= min) {
        // Prefer whichever direction moves the designer's colour least.
        if (!winner || step < winner.steps) winner = {l, ratio, steps: step};
        break;
      }
    }
  }

  if (winner) {
    return {
      color: {...fg, l: winner.l},
      fix: {token, from: fg.l, to: winner.l, ratio: winner.ratio},
    };
  }

  throw new Error(
    `Контраст недостижим для «${token}»: нужно ${min}:1, лучшее достигнутое ${best.toFixed(2)}:1 ` +
      `за ${MAX_STEPS} шагов по светлоте в обе стороны. Фон непригоден для текста — решение за человеком.`,
  );
}
