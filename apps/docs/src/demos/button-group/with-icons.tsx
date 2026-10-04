import {
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  TextAlignCenter,
  TextAlignLeft,
} from "@gravity-ui/icons";
import {Button, ButtonGroup} from "@peakui/react";

export function WithIcons() {
  return (
    <div className="flex flex-col items-start gap-4">
      <ButtonGroup>
        <Button variant="secondary">
          <ChevronLeft />
          Back
        </Button>
        <Button variant="secondary">
          <ButtonGroup.Separator />
          Next
          <ChevronRight />
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button isIconOnly aria-label="Align left" variant="tertiary">
          <TextAlignLeft />
        </Button>
        <Button isIconOnly aria-label="Align center" variant="tertiary">
          <ButtonGroup.Separator />
          <TextAlignCenter />
        </Button>
        <Button isIconOnly aria-label="More options" variant="tertiary">
          <ButtonGroup.Separator />
          <Ellipsis />
        </Button>
      </ButtonGroup>
    </div>
  );
}
