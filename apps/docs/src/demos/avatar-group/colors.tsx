import {Avatar, AvatarGroup} from "@peakui/react";

const COLORS = ["default", "accent", "success", "warning", "danger"] as const;
const INITIALS = ["JD", "KW", "EC"];

export function Colors() {
  return (
    <div className="flex flex-col items-start gap-4">
      {COLORS.map((color) => (
        <AvatarGroup key={color} color={color}>
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
