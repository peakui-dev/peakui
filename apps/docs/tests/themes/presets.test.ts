import {describe, expect, it} from "vitest";

import {deriveTheme} from "@peakui/styles/generator";

import {DEFAULT_VALUES, GALLERY, matchGallery, toPreset} from "@/app/[lang]/themes/presets";

describe("gallery", () => {
  it("derives every preset through the engine without error", () => {
    for (const preset of GALLERY) {
      expect(() =>
        deriveTheme(toPreset(preset.values, preset.semanticOverrides)),
      ).not.toThrow();
    }
  });

  it("matches its own values and reports tweaks as Custom", () => {
    expect(matchGallery(DEFAULT_VALUES)).toBe("Default");
    expect(matchGallery({...DEFAULT_VALUES, grayChroma: 0.01})).toBe("Custom");
  });
});
