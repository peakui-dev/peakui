import {deriveTheme} from "@peakui/styles/generator";
import {describe, expect, it} from "vitest";

import {buildExportCss, buildExportPreset, slugifyThemeId} from "@/app/[lang]/themes/code-panel";
import {DEFAULT_VALUES, toPreset} from "@/app/[lang]/themes/presets";

const derived = deriveTheme(toPreset(DEFAULT_VALUES));

describe("slugifyThemeId", () => {
  it("slugs names and falls back to custom when nothing survives", () => {
    expect(slugifyThemeId("MyBrand")).toBe("mybrand");
    expect(slugifyThemeId("My Brand 2")).toBe("my-brand-2");
    expect(slugifyThemeId("  --Мой--  ")).toBe("custom");
  });
});

describe("buildExportPreset", () => {
  it("emits a typed preset with a camel-cased const name and the chosen id", () => {
    const snippet = buildExportPreset("my-brand", DEFAULT_VALUES);

    expect(snippet).toContain('import type {ThemePreset} from "@peakui/styles/generator";');
    expect(snippet).toContain("export const myBrandPreset: ThemePreset = {");
    expect(snippet).toContain('"id": "my-brand"');
    expect(snippet).toContain(`"accent": "${DEFAULT_VALUES.accent}"`);
  });
});

describe("buildExportCss", () => {
  it("prefixes the engine's emission with the usage instructions", () => {
    const css = buildExportCss("mybrand", DEFAULT_VALUES, derived);

    expect(css.startsWith('/* PeakUI theme "mybrand".')).toBe(true);
    expect(css).toContain('data-theme="mybrand-light"');
    expect(css).toContain('[data-theme="mybrand-dark"]');
    expect(css).toContain("@media (forced-colors: active)");
  });
});
