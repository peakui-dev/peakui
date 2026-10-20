import {AlertDialog, Button} from "@peakui/react";

export function BackdropVariants() {
  return (
    <div className="flex flex-wrap gap-4">
      {(["opaque", "blur", "transparent"] as const).map((variant) => (
        <AlertDialog key={variant}>
          <Button variant="secondary">{variant}</Button>
          <AlertDialog.Backdrop variant={variant}>
            <AlertDialog.Container>
              <AlertDialog.Dialog className="sm:max-w-[400px]">
                <AlertDialog.Header>
                  <AlertDialog.Heading>Backdrop: {variant}</AlertDialog.Heading>
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
