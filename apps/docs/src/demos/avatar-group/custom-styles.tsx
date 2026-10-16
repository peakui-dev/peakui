import {Avatar, AvatarGroup} from "@peakui/react";

const INITIALS = ["JD", "KW", "EC"];

export function CustomStyles() {
  return (
    <div className="flex items-center gap-3">
      <AvatarGroup
        aria-label="Assignees"
        className="[--avatar-group-overlap:0.7rem] [--avatar-group-seam:2px]"
        role="group"
        size="sm"
      >
        {INITIALS.map((initials) => (
          <Avatar key={initials}>
            <Avatar.Fallback>{initials}</Avatar.Fallback>
          </Avatar>
        ))}
        <AvatarGroup.Count>+3</AvatarGroup.Count>
      </AvatarGroup>
      <span className="text-sm font-medium text-foreground">Assignees</span>
    </div>
  );
}
