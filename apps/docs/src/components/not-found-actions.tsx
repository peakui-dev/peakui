"use client";

import {Link} from "@peakui/react";

import {nextLinkRender} from "@/components/next-link-render";

interface NotFoundActionsProps {
  href: string;
  label: string;
}

/**
 * A client island: the Link render-prop callback cannot cross the server boundary of the
 * not-found page, so the client-side navigation link lives here.
 */
export function NotFoundActions({href, label}: NotFoundActionsProps) {
  return (
    <Link
      className="button button--md button--tertiary mt-4"
      href={href}
      render={nextLinkRender(href)}
    >
      {label}
    </Link>
  );
}
