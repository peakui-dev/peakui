import {Paragraph} from "@peakui/react";

export function Paragraphs() {
  return (
    <div className="flex max-w-md flex-col gap-2">
      <Paragraph>Base: the default body text of a page.</Paragraph>
      <Paragraph size="sm">Small: secondary text and captions.</Paragraph>
      <Paragraph size="xs">Extra small: fine print and metadata.</Paragraph>
    </div>
  );
}
