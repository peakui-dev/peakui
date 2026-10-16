import {Avatar, AvatarGroup} from "@peakui/react";

const INITIALS = ["JD", "KW", "EC"];

export function Variants() {
  return (
    <div className="flex flex-col items-start gap-4">
      {(["default", "soft"] as const).map((variant) => (
        <AvatarGroup key={variant} color="accent" variant={variant}>
          {INITIALS.map((initials) => (
            <Avatar key={initials}>
              <Avatar.Fallback>{initials}</Avatar.Fallback>
            </Avatar>
          ))}
        </AvatarGroup>
      ))}
    </div>
  );
}
