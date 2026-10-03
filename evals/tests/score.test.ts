import type {LayerId, LayerResult} from "../src/types.ts";

import {describe, expect, it} from "vitest";

import {check, info, layerResult, notApplicable} from "../src/scoring/findings.ts";
import {collectMistakes} from "../src/scoring/score.ts";

describe("collectMistakes", () => {
  const layers: Record<LayerId, LayerResult> = {
    build: layerResult("build", [], 1),
    render: layerResult(
      "render",
      [
        check("pending-state", "rac-props", false, "no data-pending"),
        info("i", "styling", false, "n"),
      ],
      1,
    ),
    static: layerResult(
      "static",
      [
        check("dom-state-prop", "rac-props", false, "isLoading", {
          excerpt: "<Button isLoading>",
          file: "src/a.tsx",
          line: 4,
        }),
        check("dom-state-prop", "rac-props", false, "isLoading", {
          excerpt: "<Button isLoading>",
          file: "src/a.tsx",
          line: 4,
        }),
        check("press-handler", "rac-props", true, "ok"),
      ],
      1,
    ),
    typecheck: layerResult(
      "typecheck",
      [
        check("unknown-state-prop", "rac-props", false, "Property 'isLoading'", {
          file: "src/a.tsx",
          line: 4,
        }),
      ],
      1,
    ),
  };

  it("lists failed gating findings in layer order, de-duplicated", () => {
    expect(collectMistakes(layers).map((mistake) => [mistake.layer, mistake.rule])).toEqual([
      ["typecheck", "unknown-state-prop"],
      ["static", "dom-state-prop"],
      ["render", "pending-state"],
    ]);
  });

  it("keeps the location and ignores not-applicable layers", () => {
    const mistakes = collectMistakes({...layers, render: notApplicable("render")});

    expect(mistakes[1]).toMatchObject({
      excerpt: "<Button isLoading>",
      file: "src/a.tsx",
      line: 4,
      pitfall: "rac-props",
    });
    expect(mistakes).toHaveLength(2);
  });
});
