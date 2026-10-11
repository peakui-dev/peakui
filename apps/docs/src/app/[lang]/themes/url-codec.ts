import {z} from "zod";

import type {BuilderValues} from "./presets";

import {DEFAULT_VALUES} from "./presets";

export type BuilderState = BuilderValues & {scheme: "light" | "dark"};

export const DEFAULT_STATE: BuilderState = {...DEFAULT_VALUES, scheme: "light"};

const RADIUS_IDS = ["none", "extra-small", "small", "medium", "large", "extra-large"] as const;

/*
 * A colour string the engine can parse (hex or oklch(...)); precise validation belongs to
 * parseOklch inside the engine, so the codec only rejects emptiness and lets deriveTheme fail
 * loudly if fed something impossible through a hand-crafted URL.
 */
const accentSchema = z.string().trim().min(4);

const partialSchema = z.object({
  a: accentSchema.optional(),
  g: z.number().min(0).max(0.03).optional(),
  r: z.enum(RADIUS_IDS).optional(),
  f: z.enum(RADIUS_IDS).optional(),
  da: accentSchema.optional(),
  s: z.enum(["light", "dark"]).optional(),
});

const numberOrUndefined = (raw: string | null): number | undefined =>
  raw === null ? undefined : Number(raw);

/** Query string → builder state. Any invalid param collapses the whole state to defaults. */
export function decodeBuilderState(search: string): BuilderState {
  const params = new URLSearchParams(search);
  const parsed = partialSchema.safeParse({
    a: params.get("a") ?? undefined,
    g: numberOrUndefined(params.get("g")),
    r: params.get("r") ?? undefined,
    f: params.get("f") ?? undefined,
    da: params.get("da") ?? undefined,
    s: params.get("s") ?? undefined,
  });

  if (!parsed.success) return DEFAULT_STATE;

  return {
    accent: parsed.data.a ?? DEFAULT_STATE.accent,
    grayChroma: parsed.data.g ?? DEFAULT_STATE.grayChroma,
    radius: parsed.data.r ?? DEFAULT_STATE.radius,
    formRadius: parsed.data.f ?? DEFAULT_STATE.formRadius,
    darkAccent: parsed.data.da ?? DEFAULT_STATE.darkAccent,
    scheme: parsed.data.s ?? DEFAULT_STATE.scheme,
  };
}

/** State → query-param record, defaults omitted so a clean theme keeps a clean URL. */
export function encodeBuilderState(state: BuilderState): Record<string, string> {
  const params: Record<string, string> = {};

  if (state.accent !== DEFAULT_STATE.accent) params.a = state.accent;
  if (state.grayChroma !== DEFAULT_STATE.grayChroma) params.g = String(state.grayChroma);
  if (state.radius !== DEFAULT_STATE.radius) params.r = state.radius;
  if (state.formRadius !== DEFAULT_STATE.formRadius) params.f = state.formRadius;
  if (state.darkAccent !== undefined) params.da = state.darkAccent;
  if (state.scheme !== DEFAULT_STATE.scheme) params.s = state.scheme;

  return params;
}
