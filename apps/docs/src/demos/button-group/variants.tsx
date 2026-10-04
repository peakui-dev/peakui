import type {ComponentProps} from "react";

import {Button, ButtonGroup} from "@peakui/react";

const VARIANTS: ComponentProps<typeof Button>["variant"][] = [
  "primary",
  "secondary",
  "tertiary",
  "outline",
  "ghost",
  "danger",
];

/*
 * `variant` is set on each button, not once on the group: `Button` does not inherit group props.
 */
export function Variants() {
  return (
    <div className="flex flex-col items-start gap-4">
      {VARIANTS.map((variant) => (
        <ButtonGroup key={variant}>
          <Button variant={variant}>First</Button>
          <Button variant={variant}>
            <ButtonGroup.Separator />
            Second
          </Button>
          <Button variant={variant}>
            <ButtonGroup.Separator />
            Third
          </Button>
        </ButtonGroup>
      ))}
    </div>
  );
}
