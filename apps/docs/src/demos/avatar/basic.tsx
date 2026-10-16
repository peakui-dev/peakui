import {Avatar} from "@peakui/react";

// A portrait drawn as an SVG data URI; use your own image URL.
const photo = (hue: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="hsl(${hue} 55% 58%)"/><circle cx="20" cy="16" r="7" fill="white"/><path d="M6 40a14 14 0 0 1 28 0z" fill="white"/></svg>`,
  )}`;

export function Basic() {
  return (
    <div className="flex items-center gap-4">
      <Avatar>
        <Avatar.Image alt="Jane Doe" src={photo(210)} />
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar>
      <Avatar>
        <Avatar.Image alt="Sam Rivera" src={photo(30)} />
        <Avatar.Fallback>SR</Avatar.Fallback>
      </Avatar>
      <Avatar>
        <Avatar.Fallback>PG</Avatar.Fallback>
      </Avatar>
    </div>
  );
}
