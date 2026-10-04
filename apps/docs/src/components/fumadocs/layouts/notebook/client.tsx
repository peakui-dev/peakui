"use client";

import type {LinkItemType, MenuItemType} from "@/components/fumadocs/ui/link-item";
import type {SidebarTabWithProps} from "fumadocs-ui/components/sidebar/tabs/dropdown";
import type {ComponentProps, HTMLAttributes, PointerEvent, ReactNode} from "react";

import {ChevronDown} from "@gravity-ui/icons";
import {Popover} from "@peakui/react";
import {usePathname} from "fumadocs-core/framework";
import Link from "fumadocs-core/link";
import {useSidebar} from "fumadocs-ui/components/sidebar/base";
import {SidebarTabsDropdown, isTabActive} from "fumadocs-ui/components/sidebar/tabs/dropdown";
import {useIsScrollTop} from "fumadocs-ui/utils/use-is-scroll-top";
import {Fragment, createContext, useContext, useMemo, useRef, useState} from "react";

import {LinkItem} from "@/components/fumadocs/ui/link-item";
import {cn} from "@/utils/cn";

export const LayoutContext = createContext<
  | (LayoutInfo & {
      isNavTransparent: boolean;
    })
  | null
>(null);

export interface LayoutInfo {
  tabMode: "sidebar" | "navbar";
  navMode: "top" | "auto";
}

export function LayoutContextProvider({
  children,
  navMode,
  navTransparentMode = "none",
  tabMode,
}: LayoutInfo & {
  navTransparentMode?: "always" | "top" | "none";
  children: ReactNode;
}) {
  const isTop = useIsScrollTop({enabled: navTransparentMode === "top"}) ?? true;
  const isNavTransparent = navTransparentMode === "top" ? isTop : navTransparentMode === "always";

  return (
    <LayoutContext
      value={useMemo(
        () => ({
          isNavTransparent,
          navMode,
          tabMode,
        }),
        [isNavTransparent, navMode, tabMode],
      )}
    >
      {children}
    </LayoutContext>
  );
}

export function LayoutHeader(props: ComponentProps<"header">) {
  const {open} = useSidebar();
  const context = useContext(LayoutContext);
  const isNavTransparent = context?.isNavTransparent ?? !open;

  return (
    <header data-transparent={isNavTransparent} {...props}>
      {props.children}
    </header>
  );
}

export function LayoutBody({children, className, style, ...props}: ComponentProps<"div">) {
  const context = useContext(LayoutContext);
  const navMode = context?.navMode ?? "auto";
  const {collapsed} = useSidebar();

  const pageCol =
    "calc(var(--fd-layout-width,97rem) - var(--fd-sidebar-col) - var(--fd-toc-width))";

  return (
    <div
      id="nd-notebook-layout"
      className={cn(
        "grid min-h-(--fd-docs-height) auto-cols-auto auto-rows-auto overflow-x-clip transition-[grid-template-columns] [--fd-docs-height:100dvh] [--fd-header-height:0px] [--fd-sidebar-width:0px] [--fd-toc-popover-height:0px] [--fd-toc-width:0px]",
        className,
      )}
      style={
        {
          "--fd-docs-row-1": "var(--fd-banner-height, 0px)",
          "--fd-docs-row-2": "calc(var(--fd-docs-row-1) + var(--fd-header-height))",
          "--fd-docs-row-3": "calc(var(--fd-docs-row-2) + var(--fd-toc-popover-height))",
          "--fd-sidebar-col": collapsed ? "0px" : "var(--fd-sidebar-width)",
          gridTemplate:
            navMode === "top"
              ? `". header header header ."
        "sidebar sidebar toc-popover toc-popover ."
        "sidebar sidebar main toc ." 1fr / minmax(min-content, 1fr) var(--fd-sidebar-col) minmax(0, ${pageCol}) var(--fd-toc-width) minmax(min-content, 1fr)`
              : `"sidebar sidebar header header ."
        "sidebar sidebar toc-popover toc-popover ."
        "sidebar sidebar main toc ." 1fr / minmax(min-content, 1fr) var(--fd-sidebar-col) minmax(0, ${pageCol}) var(--fd-toc-width) minmax(min-content, 1fr)`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  );
}

export type LayoutHeaderTabsProps = ComponentProps<"div"> & {
  options?: SidebarTabWithProps[];
  filterByPathname?: boolean;
};

/**
 * Path prefix through the docs framework segment.
 * e.g. "/en/docs/react/getting-started" -> ["en", "docs", "react"]
 *      "/docs/native/components" -> ["docs", "native"]
 */
function getDocsFrameworkPrefix(pathname: string): string[] | null {
  const segments = pathname.split("/").filter(Boolean);
  const docsIndex = segments.indexOf("docs");

  if (docsIndex === -1 || segments.length <= docsIndex + 1) {
    return null;
  }

  return segments.slice(0, docsIndex + 2);
}

function prefixesEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((segment, index) => segment === b[index]);
}

/**
 * Filter tabs to the current docs framework (react vs native).
 * With i18n, URLs are /{lang}/docs/{framework}/... — comparing only the first two
 * segments would match every framework tab under the same locale.
 */
export function filterTabsByPathname(
  tabs: SidebarTabWithProps[],
  pathname: string,
): SidebarTabWithProps[] {
  const currentPrefix = getDocsFrameworkPrefix(pathname);

  if (!currentPrefix) {
    return tabs;
  }

  return tabs.filter((tab) => {
    if (!tab.url) {
      return true;
    }

    const tabPrefix = getDocsFrameworkPrefix(tab.url);

    if (!tabPrefix) {
      return true;
    }

    return prefixesEqual(currentPrefix, tabPrefix);
  });
}

/**
 * Client wrapper for SidebarTabsDropdown that filters tabs based on current pathname
 */
export function FilteredSidebarTabsDropdown({
  filterByPathname = false,
  options,
  ...props
}: ComponentProps<typeof SidebarTabsDropdown> & {filterByPathname?: boolean}) {
  const pathname = usePathname();
  const filteredOptions = useMemo(() => {
    if (!options) return undefined;

    if (!filterByPathname) {
      return options;
    }

    return filterTabsByPathname(options, pathname);
  }, [options, pathname, filterByPathname]);

  if (!filteredOptions || filteredOptions.length === 0) {
    return null;
  }

  return <SidebarTabsDropdown {...props} options={filteredOptions} />;
}

export function LayoutHeaderTabs({
  children,
  className,
  filterByPathname = false,
  options,
  ...props
}: LayoutHeaderTabsProps) {
  const pathname = usePathname();
  const filteredOptions = useMemo(() => {
    if (!options) return undefined;

    if (!filterByPathname) {
      return options;
    }

    return filterTabsByPathname(options, pathname);
  }, [options, pathname, filterByPathname]);

  const selectedIdx = useMemo(() => {
    return filteredOptions?.findLastIndex((option) => isTabActive(option, pathname));
  }, [filteredOptions, pathname]);

  return (
    <div className={cn("flex flex-row items-end gap-6", className)} {...props}>
      {filteredOptions?.map((option, i) => {
        const {props: {className, ...rest} = {}, title, unlisted, url} = option;
        const isSelected = selectedIdx === i;

        return (
          <Link
            key={i}
            href={url}
            className={cn(
              "text-fd-muted-foreground hover:text-fd-accent-foreground inline-flex items-center gap-2 border-b-2 border-transparent pb-1.5 text-sm font-medium text-nowrap transition-colors",
              unlisted && !isSelected && "hidden",
              isSelected && "border-fd-primary text-fd-primary",
              className,
            )}
            {...rest}
          >
            {title}
          </Link>
        );
      })}
      {children}
    </div>
  );
}

export function NavbarLinkItem({
  className,
  item,
  ...props
}: {item: LinkItemType} & HTMLAttributes<HTMLElement>) {
  if (item.type === "custom") return item.children;

  if (item.type === "menu") {
    return <NavbarLinkItemMenu className={className} item={item} {...props} />;
  }

  return (
    <LinkItem
      item={item}
      className={cn(
        "text-fd-muted-foreground hover:text-fd-accent-foreground data-[active=true]:text-fd-foreground text-sm transition-colors",
        className,
      )}
      {...props}
    >
      {item.text}
    </LinkItem>
  );
}

function NavbarLinkItemMenu({
  className,
  hoverDelay = 50,
  item,
  ...props
}: {item: MenuItemType; hoverDelay?: number} & HTMLAttributes<HTMLElement>) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<number>(null);
  const freezeUntil = useRef<number>(null);

  const delaySetOpen = (value: boolean) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    timeoutRef.current = window.setTimeout(() => {
      setOpen(value);
      freezeUntil.current = Date.now() + 300;
    }, hoverDelay);
  };
  const onPointerEnter = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    delaySetOpen(true);
  };
  const onPointerLeave = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    delaySetOpen(false);
  };

  function isTouchDevice() {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }

  return (
    /*
     * PeakUI Popover compound replaces the fumadocs shim: RAC owns positioning and dismissal.
     * Radix's data-state=open becomes aria-expanded (set by RAC on the trigger), and the menu
     * padding moves onto Popover.Dialog, which is the padded container in our compound.
     */
    <Popover
      isOpen={open}
      onOpenChange={(value) => {
        if (freezeUntil.current === null || Date.now() >= freezeUntil.current) setOpen(value);
      }}
    >
      <Popover.Trigger
        className={cn(
          "text-fd-muted-foreground has-data-[active=true]:text-fd-primary aria-expanded:text-fd-accent-foreground inline-flex items-center gap-1.5 p-1 text-sm transition-colors",
          className,
        )}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        {...props}
      >
        {item.url ? <LinkItem item={item as {url: string}}>{item.text}</LinkItem> : item.text}
        <ChevronDown className="size-3" />
      </Popover.Trigger>
      <Popover.Content onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
        <Popover.Dialog className="text-fd-muted-foreground flex flex-col p-1 text-start">
          {item.items.map((child, i) => {
            if (child.type === "custom") return <Fragment key={i}>{child.children}</Fragment>;

            return (
              <LinkItem
                key={i}
                className="hover:bg-fd-accent hover:text-fd-accent-foreground data-[active=true]:text-fd-primary inline-flex items-center gap-2 rounded-md p-2 transition-colors [&_svg]:size-4"
                item={child}
                onClick={() => {
                  if (isTouchDevice()) setOpen(false);
                }}
              >
                {child.icon}
                {child.text}
              </LinkItem>
            );
          })}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
