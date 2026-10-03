import type {TaskDefinition} from "../../src/types.ts";
import type {Root} from "postcss";

import {peakuiElements} from "../../src/scoring/ast.ts";
import {declarationValues, rulesWithSelector} from "../../src/scoring/css.ts";
import {check, cssUnavailable, info} from "../../src/scoring/findings.ts";

const BRAND = "#16a34a";
const BRAND_HOVER = "#15803d";
const WHITE = ["#fff", "#ffffff", "white"];

/** What the built CSS gives the primary button for one of its component variables. */
function primaryValues(css: Root, variable: string): string[] {
  return rulesWithSelector(css, "button--primary").flatMap((rule) => {
    const value = rule.declarations[variable];

    return value === undefined ? [] : [value];
  });
}

/**
 * The theme tokens the primary variant reads (`--color-accent` is what the variant's CSS names,
 * `--accent` is what the theming guide documents). Overriding either reaches the primary button
 * and, by design, leaves `--accent-soft` and the neutral roles that the other variants read alone.
 */
function tokenValues(css: Root, tokens: string[]): string[] {
  return tokens.flatMap((token) => declarationValues(css, token));
}

export const brandPrimaryButton: TaskDefinition = {
  fixture: "vite-app",
  id: "brand-primary-button",
  pitfalls: ["styling"],
  prompt:
    "Every primary PeakUI button in this app should use our brand green instead of the default color: #16a34a normally and #15803d when hovered or pressed, with white text. Do it once for the whole app — don't touch the individual buttons — and leave the other button variants alone.",
  render: {
    check({css}) {
      if (!css) return [cssUnavailable()];

      const has = (values: string[], wanted: string[]) =>
        values.some((value) => wanted.some((candidate) => value.includes(candidate)));
      const base = [
        ...primaryValues(css, "--button-bg"),
        ...tokenValues(css, ["--accent", "--color-accent"]),
      ];
      const hover = [
        ...primaryValues(css, "--button-bg-hover"),
        ...tokenValues(css, ["--accent-hover", "--color-accent-hover"]),
      ];
      const pressed = [
        ...primaryValues(css, "--button-bg-pressed"),
        ...tokenValues(css, ["--accent-hover", "--color-accent-hover"]),
      ];
      const text = [
        ...primaryValues(css, "--button-fg"),
        ...tokenValues(css, ["--accent-foreground", "--color-accent-foreground"]),
      ];

      return [
        check(
          "primary-is-brand",
          "styling",
          has(base, [BRAND]),
          `the primary button's background resolves to ${BRAND}`,
        ),
        check(
          "primary-hover-is-brand",
          "styling",
          has(hover, [BRAND_HOVER]),
          `the primary button's hover background resolves to ${BRAND_HOVER}`,
        ),
        check(
          "primary-pressed-is-brand",
          "styling",
          has(pressed, [BRAND_HOVER]),
          `the primary button's pressed background resolves to ${BRAND_HOVER}`,
        ),
        check(
          "primary-text-is-white",
          "styling",
          has(text, WHITE),
          "the primary button's text color resolves to white",
        ),
        info(
          "uses-component-variables",
          "styling",
          primaryValues(css, "--button-bg").some((value) => value.includes(BRAND)),
          "the color is set through the --button-bg component variable",
        ),
      ];
    },
  },
  staticChecks(context) {
    const styled = peakuiElements(context, "Button").filter(
      (node) => node.attributes.has("className") || node.attributes.has("style"),
    );

    return [
      check(
        "buttons-untouched",
        "styling",
        styled.length === 0,
        "no individual button is styled: the change is made once, in CSS",
        styled[0] ? {excerpt: styled[0].excerpt, line: styled[0].line} : undefined,
      ),
    ];
  },
  title: "Brand color for every primary button",
};
