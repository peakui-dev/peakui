import {Link} from "@peakui/react";

export function IconPlacement() {
  return (
    <div className="flex flex-col gap-4">
      <Link href="#">
        Icon at end (default)
        <Link.Icon />
      </Link>
      <Link href="#">
        <Link.Icon />
        Icon at start
      </Link>
    </div>
  );
}
