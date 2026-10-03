import type {TaskDefinition} from "../../src/types.ts";

import {classTokens, withText} from "../../src/scoring/dom.ts";
import {check} from "../../src/scoring/findings.ts";

const BUTTON = 'button[data-slot="button"]';

function has(element: Element | undefined, ...tokens: string[]): boolean {
  return element !== undefined && tokens.every((token) => classTokens(element).includes(token));
}

export const destructiveActions: TaskDefinition = {
  fixture: "vite-app",
  id: "destructive-actions",
  pitfalls: ["variants"],
  prompt:
    'In src/components/DangerZone.tsx add two PeakUI buttons after the paragraph: a small red "Delete account" button for the destructive action, and a small "Cancel" button that is only outlined.',
  render: {
    check({documents}) {
      const document = documents.get("default")!;
      const remove = withText(document, BUTTON, "Delete account");
      const cancel = withText(document, BUTTON, "Cancel");

      return [
        check(
          "danger-variant",
          "variants",
          has(remove, "button--sm") &&
            (has(remove, "button--danger") || has(remove, "button--danger-soft")),
          '"Delete account" is a small button in a danger variant',
        ),
        check(
          "outline-variant",
          "variants",
          has(cancel, "button--sm", "button--outline"),
          '"Cancel" is a small button in the outline variant',
        ),
      ];
    },
    ssr: {
      cases: [{name: "default", props: {}}],
      exportName: "DangerZone",
      module: "/src/components/DangerZone.tsx",
    },
  },
  staticChecks: () => [],
  title: "Destructive and outlined buttons",
};
