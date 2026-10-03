import {Envelope, Plus, TrashBin} from "@gravity-ui/icons";
import {Button} from "@peakui/react";

export function WithIcons() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button>
        <Plus />
        Add member
      </Button>
      <Button variant="secondary">
        <Envelope />
        Send invite
      </Button>
      <Button variant="danger-soft">
        Delete
        <TrashBin />
      </Button>
    </div>
  );
}
