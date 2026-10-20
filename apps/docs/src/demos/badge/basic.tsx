import {Avatar, Badge} from "@peakui/react";

// A portrait drawn as an SVG data URI; use your own image URL.
const photo = (hue: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="hsl(${hue} 55% 58%)"/><circle cx="20" cy="16" r="7" fill="white"/><path d="M6 40a14 14 0 0 1 28 0z" fill="white"/></svg>`,
  )}`;

const PEOPLE = [
  {color: "danger", count: "5", hue: 140, name: "John Doe"},
  {color: "accent", count: "New", hue: 280, name: "Kate Wilson"},
  {color: "success", count: "3", hue: 30, name: "Emily Chen"},
] as const;

export function Basic() {
  return (
    <div className="flex items-center gap-8">
      {PEOPLE.map(({color, count, hue, name}) => (
        <Badge.Anchor key={name}>
          <Avatar>
            <Avatar.Image alt={name} src={photo(hue)} />
            <Avatar.Fallback>{name.replace(/[^A-Z]/g, "")}</Avatar.Fallback>
          </Avatar>
          <Badge color={color}>{count}</Badge>
        </Badge.Anchor>
      ))}
    </div>
  );
}
