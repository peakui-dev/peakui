import {Button} from "@peakui/react";
import {useState} from "react";

export interface ConfirmButtonProps {
  onConfirm: () => void;
}

export function ConfirmButton({onConfirm}: ConfirmButtonProps) {
  const [held, setHeld] = useState(false);

  return (
    <Button onClick={onConfirm} onMouseDown={() => setHeld(true)} onMouseUp={() => setHeld(false)}>
      {held ? "Release to confirm" : "Confirm"}
    </Button>
  );
}
