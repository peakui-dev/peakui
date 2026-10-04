"use client";

import type {ComponentStatus} from "@/lib/component-status";
import type {ComponentProps, ReactNode} from "react";

import {Chip, Link} from "@peakui/react";
import NextLink from "next/link";

import {statusChipProps} from "@/lib/component-status";
import {cn} from "@/utils/cn";

export interface ComponentInfo {
  description: string;
  href: string;
  name: string;
  title: string;
}

interface ComponentItemProps {
  className?: string;
  component: ComponentInfo;
  /** Live preview rendered in the card. The card is not interactive: the whole card is a link. */
  preview?: ReactNode;
  status?: ComponentStatus;
}

export function ComponentItem({className, component, preview, status}: ComponentItemProps) {
  const {href, title} = component;
  const statusProps = status ? statusChipProps(status) : undefined;

  return (
    <div className={cn("flex flex-col gap-[9px]", className)}>
      {/* Title first on mobile, preview first on desktop */}
      <div className="order-1 sm:order-2">
        <Link
          className="no-underline"
          href={href}
          /*
           * RAC types Link's render props as a union — anchor props with an href, or span props
           * when the link has none. Every link here has an href, so the anchor member is what
           * arrives.
           */
          render={(props) => <NextLink {...(props as ComponentProps<"a">)} href={href} />}
        >
          <span className="flex items-center gap-2">
            {title}
            {statusProps ? <Chip {...statusProps} /> : null}
          </span>
        </Link>
      </div>
      <div className="relative order-2 h-[198px] overflow-hidden rounded-xl border border-separator sm:order-1">
        <Link
          aria-label={title}
          className="flex h-full w-full items-center justify-center p-6"
          href={href}
          /*
           * The anchor member of RAC's Link render-prop union — see the title link above.
           */
          render={(props) => <NextLink {...(props as ComponentProps<"a">)} href={href} />}
        >
          {/* `inert` keeps the demo out of the tab order and stops it swallowing the click. */}
          <div inert className="pointer-events-none flex max-w-full items-center justify-center">
            {preview}
          </div>
        </Link>
      </div>
    </div>
  );
}
