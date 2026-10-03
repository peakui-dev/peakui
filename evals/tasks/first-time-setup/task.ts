import type {TaskDefinition} from "../../src/types.ts";

import {
  builtLayerOrder,
  cssFiles,
  importTargets,
  rulesWithSelector,
} from "../../src/scoring/css.ts";
import {classTokens, withText} from "../../src/scoring/dom.ts";
import {check, cssUnavailable} from "../../src/scoring/findings.ts";

function isPeakuiStyles(target: string): boolean {
  return target === "@peakui/styles" || target.startsWith("@peakui/styles/");
}

export const firstTimeSetup: TaskDefinition = {
  fixture: "next-app",
  id: "first-time-setup",
  pitfalls: ["css-order", "variants", "no-provider", "imports"],
  prompt:
    '@peakui/react and @peakui/styles are already installed in this app, but nothing is wired up yet. Finish the PeakUI setup and add a primary "Get started" button to the home page (app/page.tsx) so I can see it working.',
  render: {
    check({css, cssFiles: built, documents}) {
      const button = withText(documents.get("html")!, 'button[data-slot="button"]', "Get started");
      const findings = [
        check(
          "primary-button",
          "variants",
          button !== undefined && classTokens(button).includes("button--primary"),
          'the home page renders a primary PeakUI button labelled "Get started"',
        ),
      ];

      if (!css) return [...findings, cssUnavailable()];

      const order = builtLayerOrder(built);
      const base = order.available ? order.order.indexOf("base") : -1;
      const components = order.available ? order.order.indexOf("components") : -1;

      return [
        ...findings,
        check(
          "component-css-present",
          "css-order",
          rulesWithSelector(css, ".button").some((rule) => rule.layer === "components"),
          "the built CSS holds the button rules in the components layer",
        ),
        check(
          "layer-order",
          "css-order",
          base !== -1 && components !== -1 && base < components,
          order.available
            ? `cascade layers put base before components (found: ${order.order.join(", ")})`
            : order.reason,
        ),
      ];
    },
    html: {path: ".next/server/app/index.html"},
  },
  staticChecks(context) {
    const sheets = cssFiles(context).map(({file, root}) => ({
      file,
      targets: importTargets(root).map((entry) => entry.target),
    }));
    const importing = sheets.filter((sheet) => sheet.targets.some(isPeakuiStyles));
    const misordered = importing.filter((sheet) => {
      const tailwind = sheet.targets.indexOf("tailwindcss");

      return tailwind === -1 || tailwind > sheet.targets.findIndex(isPeakuiStyles);
    });

    return [
      check(
        "styles-imported",
        "css-order",
        importing.length > 0,
        "a project stylesheet imports the PeakUI styles",
      ),
      check(
        "import-order",
        "css-order",
        misordered.length === 0,
        "Tailwind is imported before the PeakUI styles",
        misordered[0] ? {file: misordered[0].file.path} : undefined,
      ),
    ];
  },
  title: "First-time setup in a fresh app",
};
