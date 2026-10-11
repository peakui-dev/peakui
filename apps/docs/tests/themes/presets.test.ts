import {deriveTheme} from "@peakui/styles/generator";
import {describe, expect, it} from "vitest";

import {
  DEFAULT_VALUES,
  GALLERY,
  matchGallery,
  matchGalleryPreset,
  toPreset,
} from "@/app/[lang]/themes/presets";

describe("gallery", () => {
  it("derives every preset through the engine without error", () => {
    for (const preset of GALLERY) {
      expect(() => deriveTheme(toPreset(preset.values, preset.semanticOverrides))).not.toThrow();
    }
  });

  it("matches its own values and reports tweaks as Custom", () => {
    expect(matchGallery(DEFAULT_VALUES)).toBe("Default");
    expect(matchGallery({...DEFAULT_VALUES, grayChroma: 0.01})).toBe("Custom");
  });

  it("reattaches a preset's semantic overrides through matching", () => {
    const netflix = GALLERY.find((preset) => preset.name === "Netflix")!;

    expect(matchGalleryPreset(netflix.values)?.semanticOverrides).toBe(netflix.semanticOverrides);
    expect(matchGalleryPreset({...netflix.values, grayChroma: 0.009})).toBeUndefined();
  });
});
