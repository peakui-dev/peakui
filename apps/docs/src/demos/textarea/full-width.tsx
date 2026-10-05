import {Surface, TextArea} from "@peakui/react";

export function FullWidth() {
  return (
    <div className="w-[400px] space-y-3">
      <TextArea fullWidth aria-label="Full width" placeholder="Full width textarea" />
      <Surface className="w-full rounded-3xl p-6">
        <TextArea
          fullWidth
          aria-label="On surface"
          placeholder="Full width textarea on surface"
          variant="secondary"
        />
      </Surface>
    </div>
  );
}
