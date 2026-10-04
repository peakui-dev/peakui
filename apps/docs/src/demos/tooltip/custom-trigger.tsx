import {CircleQuestion} from "@gravity-ui/icons";
import {Button, Tooltip} from "@peakui/react";

/*
 * Tooltip.Trigger делает фокусируемым любой неинтерактивный элемент. Интерактивный элемент —
 * кнопку, ссылку, поле — в обёртку не кладут: он становится триггером напрямую, а два вложенных
 * интерактива нарушают WCAG (nested-interactive).
 */
export function CustomTrigger() {
  return (
    <div className="flex items-center gap-6">
      <Tooltip delay={0}>
        <Tooltip.Trigger aria-label="Info icon">
          <div className="rounded-full bg-accent-soft p-2 text-accent-soft-foreground">
            <CircleQuestion />
          </div>
        </Tooltip.Trigger>
        <Tooltip.Content showArrow>
          <Tooltip.Arrow />
          <div className="max-w-xs px-1 py-1.5">
            <p className="mb-1 font-semibold">Help information</p>
            <p className="text-sm text-muted">
              This is a helpful tooltip with more detailed information about this feature.
            </p>
          </div>
        </Tooltip.Content>
      </Tooltip>

      <Tooltip delay={0}>
        <Button isIconOnly aria-label="Attach a file" variant="tertiary">
          <CircleQuestion />
        </Button>
        <Tooltip.Content showArrow>
          <Tooltip.Arrow />
          <p>A button triggers the tooltip directly</p>
        </Tooltip.Content>
      </Tooltip>
    </div>
  );
}
