// @vitest-environment jsdom
import type {ReactElement} from "react";

import {renderToStaticMarkup} from "react-dom/server";
import {expect, it} from "vitest";

import {ColorSpecimen} from "@/components/color-specimen";

/** Parses the rendered markup, so nesting can be asserted as nesting rather than as string order. */
function render(element: ReactElement): HTMLElement {
  const host = document.createElement("div");

  host.innerHTML = renderToStaticMarkup(element);

  return host;
}

const ACCENT = (
  <ColorSpecimen
    label="Accent"
    utilities={["bg-accent", "text-accent-foreground"]}
    layers={[
      {
        foreground: "accent-foreground",
        layers: [
          {foreground: "accent-foreground", name: "accent-hover"},
          {foreground: "accent", name: "accent-foreground"},
        ],
        name: "accent",
      },
      {
        foreground: "accent-soft-foreground",
        layers: [{foreground: "accent-soft-foreground", name: "accent-soft-hover"}],
        name: "accent-soft",
        over: "surface",
      },
    ]}
  />
);

it("draws a variant inside the layer it sits on", () => {
  const host = render(ACCENT);

  expect(host.querySelector('[data-token="accent"] [data-token="accent-hover"]')).not.toBeNull();
  expect(
    host.querySelector('[data-token="accent-soft"] [data-token="accent-soft-hover"]'),
  ).not.toBeNull();
});

it("keeps every level of a nesting, however deep", () => {
  const host = render(
    <ColorSpecimen
      label="Backgrounds"
      layers={[
        {
          layers: [{layers: [{name: "background-tertiary"}], name: "background-secondary"}],
          name: "background",
        },
      ]}
    />,
  );

  expect(
    host.querySelector(
      '[data-token="background"] [data-token="background-secondary"] [data-token="background-tertiary"]',
    ),
  ).not.toBeNull();
});

it("proves a pair by writing the foreground on the fill", () => {
  const layer = render(ACCENT).querySelector<HTMLElement>('[data-token="accent"]');

  expect(layer?.style.backgroundColor).toBe("var(--accent)");
  expect(layer?.style.color).toBe("var(--accent-foreground)");
});

it("stands a translucent tint on the surface it is meant for", () => {
  const host = render(ACCENT);
  const soft = host.querySelector('[data-token="accent-soft"]');
  const underlay = soft?.parentElement?.querySelector<HTMLElement>('[data-slot="color-underlay"]');

  expect(underlay?.style.backgroundColor).toBe("var(--surface)");
  expect(soft?.textContent).toContain("over --surface");
});

it("names every layer by the token a reader types", () => {
  const host = render(ACCENT);

  for (const token of ["--accent", "--accent-hover", "--accent-foreground", "--accent-soft"]) {
    expect(host.textContent, token).toContain(token);
  }
});

it("shows the role in both themes, from the theme attributes themselves", () => {
  const host = render(ACCENT);

  expect(host.querySelector('[data-theme="default-light"]')).not.toBeNull();
  expect(host.querySelector('[data-theme="default-dark"]')).not.toBeNull();
  expect(host.querySelectorAll('[data-token="accent"]')).toHaveLength(2);
});

it("colours an ink layer's text and leaves its background alone", () => {
  const host = render(<ColorSpecimen label="Text" layers={[{kind: "ink", name: "muted"}]} />);
  const ink = host.querySelector<HTMLElement>('[data-token="muted"]');

  expect(ink?.style.color).toBe("var(--muted)");
  expect(ink?.style.backgroundColor).toBe("");
});

it("draws a line layer as a rule in its own token", () => {
  const host = render(
    <ColorSpecimen label="Separators" layers={[{kind: "line", name: "separator"}]} />,
  );
  const rule = host.querySelector<HTMLElement>('[data-token="separator"] [data-slot="color-rule"]');

  expect(rule?.style.borderColor).toBe("var(--separator)");
});

it("writes no colour value of its own", () => {
  expect(renderToStaticMarkup(ACCENT)).not.toMatch(/oklch\(|#[0-9a-f]{3,8}\b|rgb\(/i);
});
