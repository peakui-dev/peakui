import {deriveTheme} from "@peakui/styles/generator";
import {defaultPreset} from "@peakui/styles/presets";
import {describe, expect, it} from "vitest";

import {DEFAULT_VALUES, GALLERY, matchGalleryPreset, toPreset} from "@/app/[lang]/themes/presets";

describe("gallery", () => {
  it("derives every preset through the engine without error", () => {
    for (const preset of GALLERY) {
      expect(() => deriveTheme(toPreset(preset.values, preset.semanticOverrides))).not.toThrow();
    }
  });

  it("matches its own values and reports tweaks as Custom", () => {
    expect(matchGalleryPreset(DEFAULT_VALUES)?.name).toBe("Default");
    expect(matchGalleryPreset({...DEFAULT_VALUES, grayChroma: 0.01})).toBeUndefined();
  });

  it("reattaches a preset's semantic overrides through matching", () => {
    const netflix = GALLERY.find((preset) => preset.name === "Netflix")!;

    expect(matchGalleryPreset(netflix.values)?.semanticOverrides).toBe(netflix.semanticOverrides);
    expect(matchGalleryPreset({...netflix.values, grayChroma: 0.009})).toBeUndefined();
  });

  it("keeps the builder defaults in sync with the engine's default preset", () => {
    expect(DEFAULT_VALUES).toEqual({
      accent: defaultPreset.accent,
      grayChroma: defaultPreset.grayChroma,
      radius: defaultPreset.radius,
      formRadius: defaultPreset.formRadius,
      darkAccent: defaultPreset.darkAccent,
    });
  });
});
