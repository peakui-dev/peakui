import {ScrollShadow} from "@peakui/react";

export function WithoutOverflow() {
  return (
    <div className="w-full sm:max-w-sm">
      <ScrollShadow className="p-4">
        <p>Short content that fits without scrolling.</p>
      </ScrollShadow>
    </div>
  );
}
