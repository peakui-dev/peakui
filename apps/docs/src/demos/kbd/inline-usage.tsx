import {Kbd} from "@peakui/react";

export function InlineUsage() {
  return (
    <p className="text-sm">
      Press{" "}
      <Kbd>
        <Kbd.Content>Esc</Kbd.Content>
      </Kbd>{" "}
      to close the dialog, or{" "}
      <Kbd>
        <Kbd.Abbr keyValue="command" />
        <Kbd.Content>K</Kbd.Content>
      </Kbd>{" "}
      to open the command palette.
    </p>
  );
}
