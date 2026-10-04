import {Kbd} from "@peakui/react";

export function NavigationKeys() {
  return (
    <div className="flex items-center gap-4">
      <Kbd>
        <Kbd.Abbr keyValue="up" />
      </Kbd>
      <Kbd>
        <Kbd.Abbr keyValue="down" />
      </Kbd>
      <Kbd>
        <Kbd.Abbr keyValue="left" />
      </Kbd>
      <Kbd>
        <Kbd.Abbr keyValue="right" />
      </Kbd>
    </div>
  );
}
