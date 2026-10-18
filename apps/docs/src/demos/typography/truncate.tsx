import {Paragraph} from "@peakui/react";

export function Truncate() {
  return (
    <div className="w-48">
      <Paragraph truncate>A long line that does not fit in its container and is cut.</Paragraph>
    </div>
  );
}
