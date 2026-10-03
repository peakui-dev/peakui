import {Button} from "@peakui/react";

export function DangerZone() {
  return (
    <section className="flex flex-col items-start gap-3 rounded-xl border border-neutral-200 p-6">
      <h2 className="text-lg font-semibold">Danger zone</h2>
      <p className="text-sm text-neutral-600">
        Deleting your account removes all projects and cannot be undone.
      </p>
      <div className="flex gap-2">
        <Button color="danger" size="small">
          Delete account
        </Button>
        <Button size="small" variant="bordered">
          Cancel
        </Button>
      </div>
    </section>
  );
}
