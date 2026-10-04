import {Kbd} from "@peakui/react";

const KEYS = ["enter", "delete", "escape", "tab", "capslock", "space"] as const;

export function SpecialKeys() {
  return (
    <div className="flex items-center gap-4">
      {KEYS.map((keyValue) => (
        <Kbd key={keyValue}>
          <Kbd.Abbr keyValue={keyValue} />
        </Kbd>
      ))}
    </div>
  );
}
