import {Link} from "@peakui/react";

export function Disabled() {
  return (
    <Link isDisabled href="#">
      Call to action
      <Link.Icon />
    </Link>
  );
}
