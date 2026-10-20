import {AlertDialog, Button} from "@peakui/react";

const STATUSES = [
  {heading: "Sign out of your account?", status: "accent", trigger: "Sign Out"},
  {heading: "Complete this task?", status: "success", trigger: "Complete Task"},
  {heading: "Discard unsaved changes?", status: "warning", trigger: "Discard Changes"},
  {heading: "Delete your account?", status: "danger", trigger: "Delete Account"},
] as const;

export function Statuses() {
  return (
    <div className="flex flex-wrap gap-4">
      {STATUSES.map(({heading, status, trigger}) => (
        <AlertDialog key={status}>
          <Button variant="secondary">{trigger}</Button>
          <AlertDialog.Backdrop>
            <AlertDialog.Container>
              <AlertDialog.Dialog className="sm:max-w-[400px]">
                <AlertDialog.Header>
                  <AlertDialog.Icon status={status} />
                  <AlertDialog.Heading>{heading}</AlertDialog.Heading>
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
