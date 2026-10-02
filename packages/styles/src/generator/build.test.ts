import {describe, expect, it} from "vitest";

import {defaultPreset} from "../../presets/index.ts";

import {deriveTheme} from "./derive.ts";
import {buildTheme} from "./index.ts";

describe("buildTheme", () => {
  it("default проходит проверку контраста без правок", () => {
    expect(deriveTheme(defaultPreset).fixes).toEqual([]);
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
