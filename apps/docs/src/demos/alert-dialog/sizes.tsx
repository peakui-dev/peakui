import {AlertDialog, Button} from "@peakui/react";

export function Sizes() {
  return (
    <div className="flex flex-wrap gap-4">
      {(["xs", "sm", "md", "lg"] as const).map((size) => (
        <AlertDialog key={size}>
          <Button variant="secondary">{size}</Button>
          <AlertDialog.Backdrop>
            <AlertDialog.Container size={size}>
              <AlertDialog.Dialog>
                <AlertDialog.Header>
                  <AlertDialog.Icon status="warning" />
                  <AlertDialog.Heading>Size: {size}</AlertDialog.Heading>
                </AlertDialog.Header>
                <AlertDialog.Footer>
                  <Button slot="close">Got It</Button>
                </AlertDialog.Footer>
              </AlertDialog.Dialog>
            </AlertDialog.Container>
          </AlertDialog.Backdrop>
        </AlertDialog>
      ))}
    </div>
  );
}
