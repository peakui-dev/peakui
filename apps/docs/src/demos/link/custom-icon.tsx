import {Link} from "@peakui/react";

export function CustomIcon() {
  return (
    <div className="flex items-center gap-4">
      <Link href="https://example.com" rel="noopener noreferrer" target="_blank">
        External link
        <Link.Icon>
          <svg fill="currentColor" height="12" viewBox="0 0 16 16" width="12">
            <path d="M10 1.5A.75.75 0 0 0 10 3h1.94L6.97 7.97a.75.75 0 0 0 1.06 1.06L13 4.06V6a.75.75 0 0 0 1.5 0V2.25a.75.75 0 0 0-.75-.75z" />
          </svg>
        </Link.Icon>
      </Link>
      <Link href="#">
        <Link.Icon>
          <svg fill="currentColor" height="16" viewBox="0 0 20 20" width="16">
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
          </svg>
        </Link.Icon>
        Info link
      </Link>
    </div>
  );
}
