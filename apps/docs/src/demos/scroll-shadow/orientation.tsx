import {ChevronRight, Magnifier} from "@gravity-ui/icons";
import {ScrollShadow, Surface} from "@peakui/react";

const paragraphs = Array.from({length: 6}, (_, idx) => (
  <p key={`scroll-shadow-lorem-content-${idx}`}>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam pulvinar risus non risus
    hendrerit venenatis. Pellentesque sit amet hendrerit risus, sed porttitor quam.
  </p>
));

const rows = Array.from({length: 8}, (_, idx) => (
  <Surface
    key={`scroll-shadow-row-${idx}`}
    className="flex min-w-[200px] flex-row items-center gap-3 rounded-xl p-1 pr-3"
    variant="secondary"
  >
    <span className="flex aspect-square h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-surface-tertiary text-muted">
      <Magnifier />
    </span>
    <div className="flex flex-1 flex-col justify-center gap-1">
      <p className="text-sm font-medium">Bridging the Future</p>
      <p className="text-xs text-muted">Today, 6:30 PM</p>
    </div>
    <ChevronRight className="shrink-0 text-muted" />
  </Surface>
));

export function Orientation() {
  return (
    <div className="flex w-full flex-col gap-8 sm:max-w-sm">
      <div>
        <h4 className="mb-2 text-sm font-semibold">Vertical</h4>
        <ScrollShadow className="max-h-[240px] p-4" orientation="vertical">
          <div className="space-y-4">{paragraphs}</div>
        </ScrollShadow>
      </div>
      <div>
        <h4 className="mb-2 text-sm font-semibold">Horizontal</h4>
        <ScrollShadow className="p-4" orientation="horizontal">
          <div className="flex flex-row gap-4">{rows}</div>
        </ScrollShadow>
      </div>
    </div>
  );
}
