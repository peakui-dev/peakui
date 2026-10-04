import type {ComponentProps} from "react";

import {Button, ButtonGroup} from "@peakui/react";

const SIZES: ComponentProps<typeof ButtonGroup>["size"][] = ["sm", "md", "lg"];

export function Sizes() {
  return (
    <div className="flex flex-col items-start gap-4">
      {SIZES.map((size) => (
        <ButtonGroup key={size} size={size}>
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
