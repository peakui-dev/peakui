import {describe, expect, it} from "vitest";

import {check, info, layerResult, notApplicable} from "../src/scoring/findings.ts";

describe("layerResult", () => {
  it("fails when a gating finding failed", () => {
    const result = layerResult(
      "static",
      [check("a", "other", true, "ok"), check("b", "fields", false, "no")],
      5,
    );

    expect(result).toMatchObject({durationMs: 5, layer: "static", status: "fail"});
  });

  it("passes when only informational findings failed", () => {
    expect(
      layerResult("render", [info("uses-component-variables", "styling", false, "no")], 1).status,
    ).toBe("pass");
  });

  it("passes with no findings and reports not-applicable separately", () => {
    expect(layerResult("build", [], 0).status).toBe("pass");
    expect(notApplicable("render")).toEqual({
      durationMs: 0,
      findings: [],
      layer: "render",
      status: "not-applicable",
    });
  });

  it("check carries its location", () => {
    expect(check("r", "imports", false, "m", {excerpt: "x", file: "src/a.tsx", line: 3})).toEqual({
      excerpt: "x",
      file: "src/a.tsx",
      gate: true,
      line: 3,
      message: "m",
      pass: false,
      pitfall: "imports",
      rule: "r",
    });
  });
});
