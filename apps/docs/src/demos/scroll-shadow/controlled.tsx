import {ScrollShadow} from "@peakui/react";

export function Controlled() {
  return (
    <div className="flex w-full flex-col gap-6 sm:max-w-sm">
      <ScrollShadow className="h-[160px] p-4" visibility="both">
        <p>Both edges carry a shadow regardless of the scroll position.</p>
      </ScrollShadow>
      <ScrollShadow className="h-[160px] p-4" isEnabled={false}>
        <p>Detection is off: no shadows and no scroll-state attributes.</p>
      </ScrollShadow>
    </div>
  );
}
