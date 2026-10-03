import type {TaskDefinition} from "../../src/types.ts";

import {peakuiElements} from "../../src/scoring/ast.ts";
import {textOf} from "../../src/scoring/dom.ts";
import {check} from "../../src/scoring/findings.ts";

const RAW_HANDLERS = [
  "onMouseDown",
  "onMouseUp",
  "onPointerDown",
  "onPointerUp",
  "onTouchStart",
  "onTouchEnd",
  "onKeyDown",
  "onKeyUp",
];

export const pressStateLabel: TaskDefinition = {
  fixture: "vite-app",
  id: "press-state-label",
  pitfalls: ["rac-props"],
  prompt:
    'Finish src/components/ConfirmButton.tsx: a PeakUI button whose label reads "Release to confirm" while it is being held down and "Confirm" the rest of the time. It should call `onConfirm` when the press completes, and it has to work with mouse, touch and keyboard.',
  render: {
    check({documents}) {
      const button = documents.get("default")!.querySelector('button[data-slot="button"]');

      return [
        check(
          "idle-label",
          "other",
          button !== null && textOf(button) === "Confirm",
          'the idle label is "Confirm"',
        ),
      ];
    },
    ssr: {
      cases: [{name: "default", props: {onConfirm: "__fn__"}}],
      exportName: "ConfirmButton",
      module: "/src/components/ConfirmButton.tsx",
    },
  },
  staticChecks(context) {
    const buttons = peakuiElements(context, "Button");
    const has = (name: string) => buttons.some((node) => node.attributes.has(name));
    const functionChildren = buttons.some(
      (node) => node.hasFunctionChild || node.attributes.get("children")?.isFunction === true,
    );
    const raw = RAW_HANDLERS.filter(has);

    return [
      check(
        "press-state-source",
        "rac-props",
        functionChildren || has("onPressChange") || (has("onPressStart") && has("onPressEnd")),
        "the pressed state comes from the Button's own press state",
      ),
      check(
        "no-pointer-handlers",
        "rac-props",
        raw.length === 0,
        raw.length === 0
          ? "no raw pointer or key handlers on the Button"
          : `raw handlers on the Button: ${raw.join(", ")}`,
      ),
      check(
        "press-handler",
        "rac-props",
        has("onPress"),
        "the PeakUI Button handles presses with its press event",
      ),
    ];
  },
  title: "Label that follows the press state",
};
