import {Link} from "@peakui/react";

export function ButtonVariants() {
  return (
    <Link
      className="button button--md button--tertiary gap-0 px-3 py-0.5 no-underline"
      href="https://example.com"
      rel="noopener noreferrer"
      target="_blank"
    >
      Example
      <Link.Icon className="h-2 w-2" />
    </Link>
  );
}
