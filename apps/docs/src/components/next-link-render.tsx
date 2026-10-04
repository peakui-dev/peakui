"use client";

import type {ComponentProps} from "react";

import NextLink from "next/link";

/*
 * The one place the RAC anchor cast lives. RAC types Link's render props as a union — anchor
 * props with an href, or span props when the link has none. Every link wired through this
 * helper has an `href`, so the anchor member is what arrives at the render call.
 *
 * Usage: `<Link href={href} render={nextLinkRender(href)}>` — client-side routing through the
 * render prop, the settled navigation pattern for PeakUI links in this app.
 */
export function nextLinkRender(href: string) {
  // A render-prop factory, not a component — the name exists for the display-name lint rule.
  function NextLinkRender(props: unknown) {
    return <NextLink {...(props as ComponentProps<"a">)} href={href} />;
  }

  return NextLinkRender;
}
