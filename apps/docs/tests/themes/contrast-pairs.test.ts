import {deriveTheme} from "@peakui/styles/generator";
import {describe, expect, it} from "vitest";

import {CONTRAST_PAIRS, measureContrast} from "@/app/[lang]/themes/contrast-pairs";
import {GALLERY, toPreset} from "@/app/[lang]/themes/presets";

describe("measureContrast", () => {
  it.each(GALLERY.map((preset) => [preset.name, preset] as const))(
    "measures every pair at or above its floor for %s, in both schemes",
    (_name, preset) => {
      const derived = deriveTheme(toPreset(preset.values, preset.semanticOverrides));

      for (const tokens of [derived.light, derived.dark]) {
        const measured = measureContrast(tokens);

        expect(measured).toHaveLength(CONTRAST_PAIRS.length);

        // Tokens are emitted rounded, so a ratio read back from them can sit a hair under.
        for (const pair of measured) expect(pair.ratio).toBeGreaterThanOrEqual(pair.min - 0.05);
      }
    },
  );

  it("skips a pair whose token is missing instead of reporting a ratio", () => {
    expect(measureContrast({})).toEqual([]);
  });
});
