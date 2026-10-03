import type {Finding, LayerId, LayerResult, PitfallId} from "../types.ts";

export interface Location {
  file?: string;
  line?: number;
  excerpt?: string;
}

function make(
  gate: boolean,
  rule: string,
  pitfall: PitfallId,
  pass: boolean,
  message: string,
  at?: Location,
): Finding {
  return {gate, message, pass, pitfall, rule, ...at};
}

export function check(
  rule: string,
  pitfall: PitfallId,
  ok: boolean,
  message: string,
  at?: Location,
): Finding {
  return make(true, rule, pitfall, ok, message, at);
}

export function info(rule: string, pitfall: PitfallId, ok: boolean, message: string): Finding {
  return make(false, rule, pitfall, ok, message);
}

export function cssUnavailable(): Finding {
  return check("built-css-unavailable", "other", false, "the build produced no CSS");
}

export function layerResult(layer: LayerId, findings: Finding[], durationMs: number): LayerResult {
  const failed = findings.some((finding) => finding.gate && !finding.pass);

  return {durationMs, findings, layer, status: failed ? "fail" : "pass"};
}

export function notApplicable(layer: LayerId): LayerResult {
  return {durationMs: 0, findings: [], layer, status: "not-applicable"};
}
