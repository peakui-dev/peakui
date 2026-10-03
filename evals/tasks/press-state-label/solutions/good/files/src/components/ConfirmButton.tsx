import {Button} from "@peakui/react";

export interface ConfirmButtonProps {
  onConfirm: () => void;
}

export function ConfirmButton({onConfirm}: ConfirmButtonProps) {
  return (
    <Button onPress={onConfirm}>
      {({isPressed}) => (isPressed ? "Release to confirm" : "Confirm")}
    </Button>
  );
}
