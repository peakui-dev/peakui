import {renderToStaticMarkup} from "react-dom/server";
import {expect, it} from "vitest";

import {
  ColorSectionFormField,
  ColorSectionSideBySide,
  ColorSectionStacked,
} from "@/components/color-section";

it("fills a plate through var() and never with a colour value", () => {
  const html = renderToStaticMarkup(
    <ColorSectionStacked tokens={[{name: "accent", utility: "bg-accent"}]} />,
  );

  expect(html).toContain("background-color:var(--accent)");
  expect(html).not.toMatch(/oklch\(|#[0-9a-f]{3,8}\b|rgb\(/i);
});

it("names every plate in text, so the page survives forced colours", () => {
  const html = renderToStaticMarkup(
    <ColorSectionStacked tokens={[{name: "surface"}, {name: "surface-secondary"}]} />,
  );

  expect(html).toContain("--surface");
  expect(html).toContain("--surface-secondary");
});

it("draws a foreground pair on its own plate", () => {
  const html = renderToStaticMarkup(
    <ColorSectionSideBySide base={{name: "accent"}} foreground={{name: "accent-foreground"}} />,
  );

  expect(html).toContain("background-color:var(--accent)");
  expect(html).toContain("color:var(--accent-foreground)");
});

it("renders base, hover and the soft trio side by side", () => {
  const html = renderToStaticMarkup(
    <ColorSectionSideBySide
      base={{name: "danger"}}
      foreground={{name: "danger-foreground"}}
      hover={{name: "danger-hover"}}
      soft={{
        base: {
          formula: "color-mix(in oklab, var(--danger) 15%, transparent)",
          name: "danger-soft",
        },
      }}
    />,
  );
  const plates = html.match(/data-slot="color-plate"/g) ?? [];

  expect(plates).toHaveLength(4);
  expect(html).toContain("color-mix(in oklab, var(--danger) 15%, transparent)");
});

it("arranges the field tokens as a field", () => {
  const html = renderToStaticMarkup(
    <ColorSectionFormField
      background={{name: "field-background"}}
      border={{name: "field-border"}}
      foreground={{name: "field-foreground"}}
      placeholder={{name: "field-placeholder"}}
    />,
  );

  expect(html).toContain("background-color:var(--field-background)");
  expect(html).toContain("color:var(--field-placeholder)");
});
