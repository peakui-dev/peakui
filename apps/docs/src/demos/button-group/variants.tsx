import type {ComponentProps} from "react";

import {Button, ButtonGroup} from "@peakui/react";

const VARIANTS: ComponentProps<typeof ButtonGroup>["variant"][] = [
  "primary",
  "secondary",
  "tertiary",
  "outline",
  "ghost",
  "danger",
];

export function Variants() {
  return (
    <div className="flex flex-col items-start gap-4">
      {VARIANTS.map((variant) => (
        <ButtonGroup key={variant} variant={variant}>
          <Button>First</Button>
          <Button>
            <ButtonGroup.Separator />
            Second
          </Button>
          <Button>
            <ButtonGroup.Separator />
            Third
          </Button>
        </ButtonGroup>
      ))}
    </div>
  );
}
