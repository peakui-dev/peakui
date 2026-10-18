import {Heading, Paragraph} from "@peakui/react";

export function Basic() {
  return (
    <div className="flex max-w-md flex-col gap-2">
      <Heading level={2}>Account settings</Heading>
      <Paragraph color="muted">Manage your profile and how others see it.</Paragraph>
    </div>
  );
}
