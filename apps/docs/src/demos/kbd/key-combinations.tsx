import {Kbd} from "@peakui/react";

export function KeyCombinations() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span>Copy:</span>
        <Kbd>
          <Kbd.Abbr keyValue="command" />
          <Kbd.Content>C</Kbd.Content>
        </Kbd>
      </div>
      <div className="flex items-center gap-2">
        <span>Redo:</span>
        <Kbd>
          <Kbd.Abbr keyValue="command" />
          <Kbd.Abbr keyValue="shift" />
          <Kbd.Content>Z</Kbd.Content>
        </Kbd>
      </div>
      <div className="flex items-center gap-2">
        <span>Switch apps:</span>
        <Kbd>
          <Kbd.Abbr keyValue="command" />
          <Kbd.Abbr keyValue="tab" />
        </Kbd>
      </div>
    </div>
  );
}
