import type {TaskDefinition} from "../../src/types.ts";

import {peakuiElements} from "../../src/scoring/ast.ts";
import {textOf} from "../../src/scoring/dom.ts";
import {check} from "../../src/scoring/findings.ts";

const BUTTON = 'button[data-slot="button"]';
const SPINNER = '[data-slot="spinner"]';

export const pendingButton: TaskDefinition = {
  fixture: "vite-app",
  id: "pending-button",
  pitfalls: ["rac-props"],
  prompt:
    'src/components/SaveBar.tsx is missing its button. Add a PeakUI "Save" button that calls `onSave`. While `saving` is true the button should show a loading spinner and must not trigger `onSave` again.',
  render: {
    check({documents}) {
      const saving = documents.get("saving")!.querySelector(BUTTON);
      const idle = documents.get("idle")!.querySelector(BUTTON);

      return [
        check(
          "pending-state",
          "rac-props",
          saving?.getAttribute("data-pending") === "true",
          "while saving, the button is in the pending state",
        ),
        check(
          "spinner-while-pending",
          "rac-props",
          (saving?.querySelector(SPINNER) ?? null) !== null,
          "while saving, the button contains a spinner",
        ),
        check(
          "idle-state",
          "rac-props",
          idle !== null &&
            !idle.hasAttribute("data-pending") &&
            idle.querySelector(SPINNER) === null,
          "when not saving, the button is not pending and shows no spinner",
        ),
        check(
          "label",
          "other",
          [saving, idle].every((button) => button !== null && textOf(button).includes("Save")),
          'the button is labelled "Save" in both states',
        ),
      ];
    },
    ssr: {
      cases: [
        {name: "saving", props: {onSave: "__fn__", saving: true}},
        {name: "idle", props: {onSave: "__fn__", saving: false}},
      ],
      exportName: "SaveBar",
      module: "/src/components/SaveBar.tsx",
    },
  },
  staticChecks(context) {
    const pressed = peakuiElements(context, "Button").some((node) =>
      node.attributes.has("onPress"),
    );

    return [
      check(
        "press-handler",
        "rac-props",
        pressed,
        "the PeakUI Button handles presses with its press event",
      ),
    ];
  },
  title: "Button in a pending state",
};
