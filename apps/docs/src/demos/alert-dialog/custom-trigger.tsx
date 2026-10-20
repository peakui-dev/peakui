import {AlertDialog, Button} from "@peakui/react";

export function CustomTrigger() {
  return (
    <AlertDialog>
      <AlertDialog.Trigger aria-label="Remove item">
        <span className="rounded-lg border border-border px-3 py-2 text-sm">Remove item</span>
      </AlertDialog.Trigger>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog className="sm:max-w-[400px]">
            <AlertDialog.Heading>Remove this item?</AlertDialog.Heading>
            <Button slot="close">Cancel</Button>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
