import {Avatar, AvatarGroup} from "@peakui/react";

const USERS = [
  {hue: 210, name: "John Doe"},
  {hue: 140, name: "Kate Wilson"},
  {hue: 280, name: "Emily Chen"},
  {hue: 30, name: "Michael Brown"},
] as const;

// A portrait drawn as an SVG data URI; use your own image URL.
const photo = (hue: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="hsl(${hue} 55% 58%)"/><circle cx="20" cy="16" r="7" fill="white"/><path d="M6 40a14 14 0 0 1 28 0z" fill="white"/></svg>`,
  )}`;

export function Basic() {
  return (
    <AvatarGroup>
      {USERS.map((user) => (
        <Avatar key={user.name}>
          <Avatar.Image alt={user.name} src={photo(user.hue)} />
          <Avatar.Fallback>{user.name.replace(/[^A-Z]/g, "")}</Avatar.Fallback>
        </Avatar>
      ))}
    </AvatarGroup>
  );
}
