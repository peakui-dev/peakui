"use client";

import type {LinkProps} from "../link/index.ts";
import type {BreadcrumbsVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {breadcrumbsVariants} from "@peakui/styles";
import React, {createContext, use} from "react";
import {
  Breadcrumb as BreadcrumbPrimitive,
  Breadcrumbs as BreadcrumbsPrimitive,
} from "react-aria-components/Breadcrumbs";

import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {IconChevronRight} from "../icons.tsx";
import {Link} from "../link/index.ts";

/* -------------------------------------------------------------------------------------------------
 * Breadcrumbs Context
 * -----------------------------------------------------------------------------------------------*/
type BreadcrumbsContext = {
  slots?: ReturnType<typeof breadcrumbsVariants>;
  separator?: React.ReactNode;
};

const BreadcrumbsContext = createContext<BreadcrumbsContext>({});

/* -------------------------------------------------------------------------------------------------
 * Breadcrumbs Root
 * -----------------------------------------------------------------------------------------------*/
interface BreadcrumbsRootProps
  extends ComponentPropsWithRef<typeof BreadcrumbsPrimitive>, BreadcrumbsVariants {
  separator?: React.ReactNode;
}

const BreadcrumbsRoot = ({children, className, separator, ...props}: BreadcrumbsRootProps) => {
  const slots = React.useMemo(() => breadcrumbsVariants({}), []);
  const contextValue = React.useMemo(() => ({separator, slots}), [separator, slots]);

  return (
    <BreadcrumbsContext value={contextValue}>
      <BreadcrumbsPrimitive
        className={composeSlotClassName(slots.base, className)}
        {...props}
        data-slot="breadcrumbs"
      >
        {children}
      </BreadcrumbsPrimitive>
    </BreadcrumbsContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Breadcrumbs Item
 * -----------------------------------------------------------------------------------------------*/
/*
 * `render` is dropped from the primitive's props and taken from Link's instead: it replaces the
 * item's link (the router-link escape hatch), never the `<li>` — rendering the list item through
 * it would break the list semantics. Link's children function is typed over LinkRenderProps while
 * the item's render values are BreadcrumbRenderProps, so intersecting the two signatures would
 * make `children` uncallable without a cast; Link's `children` (and `className`, which the slot
 * owns) stay out of the intersection for the same reason.
 */
interface BreadcrumbsItemProps extends Omit<
  ComponentPropsWithRef<typeof BreadcrumbPrimitive>,
  "render"
> {}

const BreadcrumbsItem = ({
  children,
  className,
  render,
  ...props
}: BreadcrumbsItemProps & Omit<LinkProps, "children" | "className">) => {
  const {separator, slots} = use(BreadcrumbsContext);

  const renderSeparator = () => {
    if (!separator)
      return <IconChevronRight className={slots?.separator()} data-slot="breadcrumbs-separator" />;

    if (React.isValidElement(separator)) {
      return React.cloneElement(
        separator as React.ReactElement<{
          className?: string;
          "data-slot": "breadcrumbs-separator";
        }>,
        {
          className: slots?.separator(),
          "data-slot": "breadcrumbs-separator",
        },
      );
    }

    return separator;
  };

  return (
    <BreadcrumbPrimitive
      className={composeTwRenderProps(className, slots?.item())}
      {...props}
      data-slot="breadcrumbs-item"
    >
      {(values) => {
        if (typeof children === "function") {
          return children(values);
        }

        return (
          <>
            <Link className={slots?.link()} render={render} {...props}>
              {children}
            </Link>
            {!values.isCurrent && renderSeparator()}
          </>
        );
      }}
    </BreadcrumbPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {BreadcrumbsRoot, BreadcrumbsItem};

export type {BreadcrumbsRootProps, BreadcrumbsItemProps};
