import {readFileSync} from "node:fs";
import {createRequire} from "node:module";

import {describe, expect, it} from "vitest";

import {extractThemeDerivations} from "@/app/[lang]/themes/theme-derivations";

const require = createRequire(import.meta.url);
const themeCssPath = require.resolve("@peakui/styles/themes/shared/theme.css");

describe("extractThemeDerivations", () => {
  it("keeps var()-referencing declarations verbatim and drops static ones", () => {
    const css = [
      "/* comment */",
      "@theme inline {",
      "  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);",
      "  --radius-3xl: calc(var(--radius) * 3);",
      "  --color-field: var(--field-background, var(--default));",
      "}",
    ].join("\n");

    expect(extractThemeDerivations(css)).toBe(
      [
        "  --radius-3xl: calc(var(--radius) * 3);",
        "  --color-field: var(--field-background, var(--default));",
      ].join("\n"),
    );
  });

  it("covers the real shared theme.css", () => {
    const css = readFileSync(themeCssPath, "utf8");
    const derivations = extractThemeDerivations(css);
    const lines = derivations.split("\n");

    expect(lines.length).toBeGreaterThan(50);
    expect(derivations).toContain("--radius-md: calc(var(--radius) * 0.75);");
    expect(derivations).toContain("--radius-field: var(--field-radius);");
    expect(derivations).toContain("--color-field: var(--field-background, var(--default));");
    expect(derivations).not.toContain("--ease-smooth");
  });
});
