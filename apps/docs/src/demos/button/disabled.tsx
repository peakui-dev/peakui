import {Button} from "@peakui/react";

export function Disabled() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button isDisabled variant="primary">
        Primary
      </Button>
      <Button isDisabled variant="secondary">
        Secondary
      </Button>
      <Button isDisabled variant="tertiary">
        Tertiary
      </Button>
      <Button isDisabled variant="outline">
        Outline
      </Button>
      <Button isDisabled variant="ghost">
        Ghost
      </Button>
      <Button isDisabled variant="danger">
        Danger
      </Button>
    </div>
  );
}
