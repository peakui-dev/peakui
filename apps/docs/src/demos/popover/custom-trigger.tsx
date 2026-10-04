import {Button, Popover} from "@peakui/react";

/*
 * Popover.Trigger makes any non-interactive element pressable. Interactive elements — buttons,
 * links, fields — become the trigger directly: nesting two interactive elements violates WCAG
 * (nested-interactive).
 */
export function CustomTrigger() {
  return (
    <Popover>
      <Popover.Trigger aria-label="Zoe's profile">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-accent-soft text-sm font-medium text-accent-soft-foreground">
            Z
          </span>
          <div className="flex flex-col">
            <p className="text-sm font-medium leading-5">Zoe Lang</p>
            <p className="text-xs leading-none text-muted">zoe@example.com</p>
          </div>
        </div>
      </Popover.Trigger>
      <Popover.Content className="w-[290px]">
        <Popover.Dialog className="flex flex-col gap-3">
          <Popover.Heading>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-sm font-medium text-accent-soft-foreground">
                  Z
                </span>
                <div className="flex flex-col items-start justify-center">
                  <span className="text-sm font-medium">Zoe Lang</span>
                  <span className="text-sm font-normal leading-4 tracking-tight text-muted">
                    @zoe
                  </span>
                </div>
              </div>
              <Button className="rounded-full text-xs font-normal" size="sm">
                Follow
              </Button>
            </div>
          </Popover.Heading>
          <p className="text-sm">
            Design engineer building design systems and polishing component APIs.
          </p>
          <div className="flex gap-3">
            <div className="flex gap-1">
              <p className="text-sm font-semibold">4</p>
              <p className="text-sm text-muted">Following</p>
            </div>
            <div className="flex gap-1">
              <p className="text-sm font-semibold">97.1K</p>
              <p className="text-sm text-muted">Followers</p>
            </div>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
