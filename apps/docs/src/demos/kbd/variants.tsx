import {Kbd} from "@peakui/react";

export function Variants() {
  return (
    <div className="flex items-center gap-6">
      <Kbd>
        <Kbd.Abbr keyValue="command" />
        <Kbd.Content>C</Kbd.Content>
      </Kbd>
      <Kbd variant="light">
        <Kbd.Abbr keyValue="command" />
        <Kbd.Content>C</Kbd.Content>
      </Kbd>
    </div>
  );
}
