import {Surface} from "@peakui/react";

export function Nested() {
  return (
    <Surface className="flex w-fit flex-col gap-4 rounded-3xl p-6">
      <p className="text-sm font-medium">Default</p>
      <Surface className="flex flex-col gap-4 rounded-2xl p-6" variant="secondary">
        <p className="text-sm font-medium">Secondary</p>
        <Surface className="flex flex-col gap-2 rounded-xl p-6" variant="tertiary">
          <p className="text-sm">Tertiary — the innermost level.</p>
        </Surface>
      </Surface>
    </Surface>
  );
}
