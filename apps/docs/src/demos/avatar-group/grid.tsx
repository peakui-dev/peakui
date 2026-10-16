import {Avatar, AvatarGroup} from "@peakui/react";

const INITIALS = ["JD", "KW", "EC", "MB", "OD", "AB"];

export function Grid() {
  return (
    <div className="max-w-40">
      <AvatarGroup isGrid>
        {INITIALS.map((initials) => (
          <Avatar key={initials}>
            <Avatar.Fallback>{initials}</Avatar.Fallback>
          </Avatar>
        ))}
      </AvatarGroup>
    </div>
  );
}
