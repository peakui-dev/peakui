import {ChevronLeft, Magnifier} from "@gravity-ui/icons";
import {ScrollShadow, Surface} from "@peakui/react";

const rows = Array.from({length: 8}, (_, idx) => (
  <Surface
    key={`scroll-shadow-row-${idx}`}
    className="flex min-w-[200px] flex-row items-center gap-3 rounded-xl p-1 pl-3"
    variant="secondary"
  >
    <span className="flex aspect-square h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-surface-tertiary text-muted">
      <Magnifier />
    </span>
    <div className="flex flex-1 flex-col justify-center gap-1">
      <p className="text-sm font-medium">Bridging the Future</p>
      <p className="text-xs text-muted">Today, 6:30 PM</p>
    </div>
    <ChevronLeft className="shrink-0 text-muted" />
  </Surface>
));

export function Rtl() {
  return (
    <div className="w-full sm:max-w-sm" dir="rtl">
      <ScrollShadow className="p-4" orientation="horizontal">
        <div className="flex flex-row gap-4">{rows}</div>
      </ScrollShadow>
    </div>
  );
}
