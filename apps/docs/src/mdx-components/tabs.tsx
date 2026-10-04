"use client";

import type {Tabs as PeakTabs} from "@peakui/react";
import type {ComponentProps, ReactNode} from "react";

import {Tabs as PeakTabsComponent} from "@peakui/react";

import {cn} from "@/utils/cn";

/*
 * The MDX-facing tabs of the docs site, built on the PeakUI compound instead of the
 * layout library's Radix tabs. The exported names are the ones MDX pages and
 * getMDXComponents rely on: Tabs, TabsList, TabsTrigger, TabsContent, Tab.
 *
 * `value` on a trigger and its content must match — it maps onto the compound's
 * tab and panel `id`. Unlike the Radix version, a `Tab` needs its `value` given
 * explicitly (no index detection).
 */

export interface DocsTabsProps extends Omit<ComponentProps<typeof PeakTabs>, "variant"> {
  /** The initially selected tab value. */
  defaultValue?: string;
}

export function Tabs({defaultValue, ...props}: DocsTabsProps) {
  return <PeakTabsComponent defaultSelectedKey={defaultValue} variant="secondary" {...props} />;
}

export function TabsList({className, ...props}: ComponentProps<typeof PeakTabs.List>) {
  return (
    <PeakTabsComponent.ListContainer>
      <PeakTabsComponent.List className={cn("min-w-full", className)} {...props} />
    </PeakTabsComponent.ListContainer>
  );
}

export interface DocsTabsTriggerProps extends Omit<
  ComponentProps<typeof PeakTabs.Tab>,
  "children" | "id"
> {
  /** The tab value; must match the value of its content panel. */
  value: string;
  /** The trigger label. */
  children?: ReactNode;
}

export function TabsTrigger({children, value, ...props}: DocsTabsTriggerProps) {
  return (
    <PeakTabsComponent.Tab id={value} {...props}>
      {children}
      <PeakTabsComponent.Indicator />
    </PeakTabsComponent.Tab>
  );
}

export interface DocsTabsContentProps extends Omit<ComponentProps<typeof PeakTabs.Panel>, "id"> {
  /** The panel value; must match the value of its tab trigger. */
  value: string;
}

export function TabsContent({value, ...props}: DocsTabsContentProps) {
  return <PeakTabsComponent.Panel id={value} {...props} />;
}

/** A content panel; alias of `TabsContent` with the `value` required. */
export const Tab = TabsContent;
