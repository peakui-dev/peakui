import {Avatar, AvatarGroup} from "@peakui/react";

const INITIALS = ["JD", "KW", "EC"];

export function Count() {
  return (
    <AvatarGroup size="sm">
      {INITIALS.map((initials) => (
        <Avatar key={initials}>
          <Avatar.Fallback>{initials}</Avatar.Fallback>
        </Avatar>
      ))}
      <AvatarGroup.Count>+9</AvatarGroup.Count>
    </AvatarGroup>
  );
}
