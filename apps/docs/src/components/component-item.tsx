import type {StatusChipStatus} from "./status-chip";
import type {ReactNode} from "react";

import LinkRoot from "fumadocs-core/link";

import {cn} from "@/utils/cn";

import {StatusChip} from "./status-chip";

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
  status?: StatusChipStatus;
}

export function ComponentItem({className, component, preview, status}: ComponentItemProps) {
  const {href, title} = component;

  return (
    <div className={cn("flex flex-col gap-[9px]", className)}>
      {/* Title first on mobile, preview first on desktop */}
      <div className="order-1 sm:order-2">
        <LinkRoot className="link no-underline" href={href}>
          <span className="flex items-center gap-2">
            {title}
            {status ? <StatusChip className="w-fit" status={status} /> : null}
          </span>
        </LinkRoot>
      </div>
      <div className="relative order-2 h-[198px] overflow-hidden rounded-xl border border-separator sm:order-1">
        <LinkRoot
          aria-label={title}
          className="flex h-full w-full items-center justify-center p-6"
          href={href}
        >
          {/* `inert` keeps the demo out of the tab order and stops it swallowing the click. */}
          <div inert className="pointer-events-none flex max-w-full items-center justify-center">
            {preview}
          </div>
        </LinkRoot>
      </div>
    </div>
  );
}
