import {Button} from "@peakui/react";

export interface SaveBarProps {
  saving: boolean;
  onSave: () => void;
}

export function SaveBar({onSave, saving}: SaveBarProps) {
  return (
    <div className="flex justify-end border-t border-neutral-200 p-4">
      <Button isPending={saving} onPress={onSave}>
        Save
      </Button>
    </div>
  );
}
