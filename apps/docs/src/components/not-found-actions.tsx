"use client";

import type {ComponentProps} from "react";

import {Link} from "@peakui/react";
import NextLink from "next/link";

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
      /*
       * RAC types Link's render props as a union — anchor props with an href, or span props
       * when the link has none. This link always has an href, so the anchor member is what
       * arrives.
       */
      render={(props) => <NextLink {...(props as ComponentProps<"a">)} href={href} />}
    >
      {label}
    </Link>
  );
}
