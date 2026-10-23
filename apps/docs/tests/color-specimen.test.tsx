import {renderToStaticMarkup} from "react-dom/server";
import {expect, it} from "vitest";

import {ColorSpecimen} from "@/components/color-specimen";

const ACCENT = (
  <ColorSpecimen
    label="Accent"
    utilities={["bg-accent", "text-accent-foreground"]}
    bands={[
      {foreground: "accent-foreground", name: "accent"},
      {foreground: "accent-foreground", name: "accent-hover"},
    ]}
  />
);

it("shows the role in both themes, from the theme attributes themselves", () => {
  const html = renderToStaticMarkup(ACCENT);

  expect(html).toContain('data-theme="default-light"');
  expect(html).toContain('data-theme="default-dark"');
  expect(html.match(/background-color:var\(--background\)/g)).toHaveLength(2);
});

it("writes a fill band's token on the colour, in the colour it pairs with", () => {
  const html = renderToStaticMarkup(ACCENT);

  expect(html).toContain("background-color:var(--accent);color:var(--accent-foreground)");
  expect(html).toContain("--accent-hover");
});

it("repeats every band once per theme", () => {
  const html = renderToStaticMarkup(ACCENT);

  expect(html.match(/data-slot="color-band"/g)).toHaveLength(4);
});

it("names the utilities a reader types", () => {
  const html = renderToStaticMarkup(ACCENT);

  expect(html).toContain("bg-accent");
  expect(html).toContain("text-accent-foreground");
});

it("colours an ink band's text and leaves its background alone", () => {
  const html = renderToStaticMarkup(
    <ColorSpecimen bands={[{kind: "ink", name: "muted"}]} label="Text" />,
  );

  expect(html).toContain("color:var(--muted)");
  expect(html).not.toContain("background-color:var(--muted)");
});

it("draws a line band as a rule in its own token", () => {
  const html = renderToStaticMarkup(
    <ColorSpecimen bands={[{kind: "line", name: "separator"}]} label="Separators" />,
  );

  expect(html).toContain("border-color:var(--separator)");
  expect(html).not.toContain("background-color:var(--separator)");
});

it("writes no colour value of its own", () => {
  const html = renderToStaticMarkup(ACCENT);

  expect(html).not.toMatch(/oklch\(|#[0-9a-f]{3,8}\b|rgb\(/i);
});
