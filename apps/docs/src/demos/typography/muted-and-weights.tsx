import {Paragraph} from "@peakui/react";

export function MutedAndWeights() {
  return (
    <div className="flex flex-col gap-1">
      <Paragraph color="muted">Muted text for supporting information.</Paragraph>
      <Paragraph weight="normal">Weight normal</Paragraph>
      <Paragraph weight="medium">Weight medium</Paragraph>
      <Paragraph weight="semibold">Weight semibold</Paragraph>
      <Paragraph weight="bold">Weight bold</Paragraph>
    </div>
  );
}
