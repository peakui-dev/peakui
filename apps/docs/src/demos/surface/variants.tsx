import {Surface} from "@peakui/react";

export function Variants() {
  return (
    <div className="flex flex-col gap-4">
      <Surface className="rounded-3xl p-5 text-sm">Default — bg-surface</Surface>
      <Surface className="rounded-3xl p-5 text-sm" variant="secondary">
        Secondary — bg-surface-secondary
      </Surface>
      <Surface className="rounded-3xl p-5 text-sm" variant="tertiary">
        Tertiary — bg-surface-tertiary
      </Surface>
      <Surface className="rounded-3xl border p-5 text-sm" variant="transparent">
        Transparent — no background of its own
      </Surface>
    </div>
  );
}
