import {Avatar, AvatarGroup} from "@peakui/react";

const INITIALS = ["JD", "KW", "EC"];

export function Sizes() {
  return (
    <div className="flex flex-col items-start gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <AvatarGroup key={size} size={size}>
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
