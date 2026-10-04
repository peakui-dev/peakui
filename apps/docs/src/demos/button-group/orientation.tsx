import {TextAlignCenter, TextAlignJustify, TextAlignLeft, TextAlignRight} from "@gravity-ui/icons";
import {Button, ButtonGroup} from "@peakui/react";

export function Orientation() {
  return (
    <div className="flex items-start gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted">Horizontal</span>
        <ButtonGroup orientation="horizontal">
          <Button isIconOnly aria-label="Align left" variant="tertiary">
            <TextAlignLeft />
          </Button>
          <Button isIconOnly aria-label="Align center" variant="tertiary">
            <ButtonGroup.Separator />
            <TextAlignCenter />
          </Button>
          <Button isIconOnly aria-label="Align right" variant="tertiary">
            <ButtonGroup.Separator />
            <TextAlignRight />
          </Button>
          <Button isIconOnly aria-label="Justify" variant="tertiary">
            <ButtonGroup.Separator />
            <TextAlignJustify />
          </Button>
        </ButtonGroup>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted">Vertical</span>
        <ButtonGroup orientation="vertical">
          <Button isIconOnly aria-label="Align left" variant="tertiary">
            <TextAlignLeft />
          </Button>
          <Button isIconOnly aria-label="Align center" variant="tertiary">
            <ButtonGroup.Separator />
            <TextAlignCenter />
          </Button>
          <Button isIconOnly aria-label="Align right" variant="tertiary">
            <ButtonGroup.Separator />
            <TextAlignRight />
          </Button>
          <Button isIconOnly aria-label="Justify" variant="tertiary">
            <ButtonGroup.Separator />
            <TextAlignJustify />
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}
