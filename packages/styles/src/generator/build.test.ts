import {describe, expect, it} from "vitest";

import {defaultPreset} from "../../presets/index.ts";

import {deriveTheme} from "./derive.ts";
import {buildTheme} from "./index.ts";

describe("buildTheme", () => {
  it("default проходит проверку контраста без правок", () => {
    expect(deriveTheme(defaultPreset).fixes).toEqual([]);
  });

  it("gives the dark field a visible edge where light uses a shadow", () => {
    const {light, dark} = deriveTheme(defaultPreset);

    /*
     * The field's resting edge is its shadow — the border is 0px and transparent in both
     * schemes. Light draws it with a soft drop shadow; in dark the field background IS the
     * surface colour, and a drop shadow cannot read there, so the edge must be the same inset
     * hairline the overlay gets. The 2026-10-23 design-taste eval flagged every dark screen
     * for the invisible field this line used to produce.
     */
    expect(light["field-shadow"]).not.toMatch(/transparent/);
    expect(dark["field-shadow"]).toBe("0 0 1px 0 oklch(1 0 0 / 0.3) inset");
  });

  it("пишет три файла темы", () => {
    expect(buildTheme(defaultPreset).map((f) => f.path)).toEqual([
      "themes/default/variables.css",
      "themes/default/index.css",
      "themes/default/components/index.css",
    ]);
  });

  it("index.css импортирует общую поверхность, свои переменные и свои компоненты", () => {
    const index = buildTheme(defaultPreset).find((f) => f.path.endsWith("default/index.css"))!.css;

    expect(index).toContain('@import "../shared/theme.css"');
    expect(index).toContain('@import "./variables.css" layer(theme)');
    expect(index).toContain('@import "./components/index.css" layer(components)');
  });
});
