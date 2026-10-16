import {Avatar, AvatarGroup} from "@peakui/react";

const INITIALS = ["JD", "KW", "EC"];

export function Overlap() {
  return (
    <div className="flex flex-col items-start gap-6">
      {(["clip", "ring"] as const).map((overlap) => (
        <div key={overlap} className="flex flex-col gap-2">
          <p className="text-sm text-muted">{overlap}</p>
          <AvatarGroup overlap={overlap} size="lg">
            {INITIALS.map((initials) => (
              <Avatar key={initials}>
                <Avatar.Fallback>{initials}</Avatar.Fallback>
              </Avatar>
            ))}
            <AvatarGroup.Count>+2</AvatarGroup.Count>
          </AvatarGroup>
        </div>
      ))}
    </div>
  );
}
