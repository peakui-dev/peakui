import type {ComponentProps} from "react";

import {Button, ButtonGroup} from "@peakui/react";

const SIZES: ComponentProps<typeof Button>["size"][] = ["sm", "md", "lg"];

/* `size` is set on each button, not once on the group: `Button` does not inherit group props. */
export function Sizes() {
  return (
    <div className="flex flex-col items-start gap-4">
      {SIZES.map((size) => (
        <ButtonGroup key={size}>
          <Button size={size}>First</Button>
          <Button size={size}>
            <ButtonGroup.Separator />
            Second
          </Button>
          <Button size={size}>
            <ButtonGroup.Separator />
            Third
          </Button>
        </ButtonGroup>
      ))}
    </div>
  );
}
