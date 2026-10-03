import type {TaskDefinition} from "../../src/types.ts";

import {classTokens, textOf} from "../../src/scoring/dom.ts";
import {check} from "../../src/scoring/findings.ts";

export const linkAsButton: TaskDefinition = {
  fixture: "vite-app",
  id: "link-as-button",
  pitfalls: ["composition", "styling"],
  prompt:
    'The "View pricing" link in src/components/Hero.tsx should look like a PeakUI secondary button. It has to stay a real link to /pricing.',
  render: {
    check({documents}) {
      const links = [...documents.get("default")!.querySelectorAll('a[href="/pricing"]')];
      const link = links.length === 1 ? links[0] : undefined;
      const tokens = link ? classTokens(link) : [];

      return [
        check(
          "still-a-link",
          "composition",
          link !== undefined && textOf(link) === "View pricing",
          'exactly one link to /pricing labelled "View pricing"',
        ),
        check(
          "button-classes",
          "styling",
          tokens.includes("button") && tokens.includes("button--secondary"),
          "the link carries the secondary button classes",
        ),
        check(
          "no-nested-interactive",
          "composition",
          link !== undefined &&
            link.closest("button") === null &&
            link.querySelector("button") === null,
          "no button inside or around the link",
        ),
        check(
          "not-a-pressable",
          "composition",
          link !== undefined && !link.hasAttribute("data-react-aria-pressable"),
          "the link is a plain anchor, not a Button re-rendered as one",
        ),
      ];
    },
    ssr: {
      cases: [{name: "default", props: {}}],
      exportName: "Hero",
      module: "/src/components/Hero.tsx",
    },
  },
  staticChecks: () => [],
  title: "Link that looks like a button",
};
