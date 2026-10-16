import {Avatar, AvatarGroup} from "@peakui/react";

const INITIALS = ["JD", "KW", "EC", "MB", "OD"];

export function Max() {
  return (
    <AvatarGroup max={3}>
      {INITIALS.map((initials) => (
        <Avatar key={initials}>
          <Avatar.Fallback>{initials}</Avatar.Fallback>
        </Avatar>
      ))}
    </AvatarGroup>
  );
}
