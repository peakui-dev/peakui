import {Person} from "@gravity-ui/icons";
import {Avatar} from "@peakui/react";

export function Fallback() {
  return (
    <div className="flex items-center gap-4">
      {/* Text fallback */}
      <Avatar>
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar>

      {/* Icon fallback */}
      <Avatar>
        <Avatar.Fallback>
          <Person />
        </Avatar.Fallback>
      </Avatar>

      {/* Shown when the image fails; delayMs holds it back so a fast image never flashes it */}
      <Avatar>
        <Avatar.Image alt="Broken image" src="https://invalid.test/avatar.png" />
        <Avatar.Fallback delayMs={600}>NA</Avatar.Fallback>
      </Avatar>
    </div>
  );
}
