import {Link} from "@peakui/react";

export function Underline() {
  return (
    <div className="flex flex-col gap-3">
      {/* The default: underlined on hover only. */}
      <Link href="#">Hover to see the underline</Link>
      <Link className="underline" href="#">
        Underline always visible
      </Link>
      <Link className="no-underline" href="#">
        Link without any underline
      </Link>
      <Link className="underline-offset-1" href="#">
        Offset 1 (1px space)
      </Link>
      <Link className="underline-offset-4" href="#">
        Offset 4 (4px space)
      </Link>
    </div>
  );
}
