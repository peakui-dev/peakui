import {AlertDialog, Button} from "@peakui/react";

export function Placements() {
  return (
    <div className="flex flex-wrap gap-4">
      {(["auto", "top", "center", "bottom"] as const).map((placement) => (
        <AlertDialog key={placement}>
          <Button variant="secondary">{placement}</Button>
          <AlertDialog.Backdrop>
            <AlertDialog.Container placement={placement}>
              <AlertDialog.Dialog className="sm:max-w-[400px]">
                <AlertDialog.Header>
                  <AlertDialog.Heading>Placement: {placement}</AlertDialog.Heading>
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
