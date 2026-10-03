import type {TaskDefinition} from "../../src/types.ts";

import {parsedSources} from "../../src/scoring/ast.ts";
import {classRuleExists} from "../../src/scoring/css.ts";
import {classTokens, countOf} from "../../src/scoring/dom.ts";
import {check, cssUnavailable} from "../../src/scoring/findings.ts";

const SHARED = {children: "Label", size: "lg", variant: "secondary"};

function tokensOf(element: Element | null): string[] {
  return element ? classTokens(element) : [];
}

function signature(element: Element | null): string {
  return `${[...tokensOf(element)].sort().join(" ")}|${element?.getAttribute("style") ?? ""}`;
}

export const customButtonVariant: TaskDefinition = {
  fixture: "vite-app",
  id: "custom-button-variant",
  pitfalls: ["styling", "tailwind-scanning", "composition"],
  prompt:
    'We want our own button for this app. Create src/components/AppButton.tsx exporting `AppButton`: it should behave exactly like the PeakUI button and accept everything it accepts, plus a `radius` option that is either "full" or "sm" (default "full") for the corner rounding. Use it for a "Get started" button in src/App.tsx.',
  render: {
    check({css, documents}) {
      const [sm, full, fallback] = ["sm", "full", "default"].map(
        (name) => documents.get(name)!.body.firstElementChild,
      );
      const smTokens = tokensOf(sm ?? null);
      const fullTokens = tokensOf(full ?? null);
      const unique = [
        ...smTokens.filter((token) => !fullTokens.includes(token)),
        ...fullTokens.filter((token) => !smTokens.includes(token)),
      ];
      const findings = [
        check(
          "renders-button",
          "composition",
          [sm, full, fallback].every(
            (element) => element?.matches('button[data-slot="button"]') ?? false,
          ),
          "the root element is the PeakUI button",
        ),
        check(
          "variant-classes-once",
          "styling",
          ["button", "button--lg", "button--secondary"].every(
            (token) => countOf(smTokens, token) === 1,
          ),
          "size and variant classes reach the element exactly once",
        ),
        check(
          "radius-changes-output",
          "styling",
          signature(sm ?? null) !== signature(full ?? null),
          'radius "sm" and radius "full" render differently',
        ),
        check(
          "default-radius-full",
          "styling",
          signature(fallback ?? null) === signature(full ?? null),
          'omitting radius renders like radius "full"',
        ),
      ];

      if (!css) return [...findings, cssUnavailable()];

      const missing = unique.filter((token) => !classRuleExists(css, token));

      return [
        ...findings,
        check(
          "radius-classes-have-rules",
          "tailwind-scanning",
          missing.length === 0,
          missing.length === 0
            ? "every radius class has a rule in the built CSS"
            : `no CSS rule for: ${missing.join(", ")}`,
        ),
      ];
    },
    ssr: {
      cases: [
        {name: "sm", props: {...SHARED, radius: "sm"}},
        {name: "full", props: {...SHARED, radius: "full"}},
        {name: "default", props: SHARED},
      ],
      exportName: "AppButton",
      module: "/src/components/AppButton.tsx",
    },
  },
  staticChecks(context) {
    const app = parsedSources(context).find((source) => source.file.path === "src/App.tsx");

    return [
      check(
        "button-is-used",
        "other",
        app?.jsx.some((node) => node.tag === "AppButton") ?? false,
        "src/App.tsx renders AppButton",
      ),
    ];
  },
  title: "Custom button variant",
};
