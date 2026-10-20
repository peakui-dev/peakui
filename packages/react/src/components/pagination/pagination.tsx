"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {PaginationVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, JSX, ReactNode} from "react";

import {paginationVariants} from "@peakui/styles";
import React, {createContext, use} from "react";
import {Button as ButtonPrimitive} from "react-aria-components/Button";

import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";
import {IconChevronLeft, IconChevronRight} from "../icons.tsx";

/*
 * Pagination is a navigation landmark around a list of page buttons. RAC has no pagination
 * primitive, so the container parts are plain elements through `dom.*`; the interactive parts
 * (Link, Previous, Next) compose RAC's Button for press, focus and disabled handling.
 *
 * Every polymorphic part spreads its props through `any` for the same reason: the element type is
 * a parameter and the spread has erased it (references/typescript.md, the polymorphic spread
 * boundary).
 */

/* -------------------------------------------------------------------------------------------------
 * Pagination Context
 * -----------------------------------------------------------------------------------------------*/
type PaginationContext = {
  slots?: ReturnType<typeof paginationVariants>;
};

const PaginationContext = createContext<PaginationContext>({});

/* -------------------------------------------------------------------------------------------------
 * Pagination Root
 * -----------------------------------------------------------------------------------------------*/
interface PaginationRootProps<E extends keyof JSX.IntrinsicElements = "nav"> extends DOMRenderProps<
  E,
  undefined
> {
  children?: ReactNode;
  className?: string;
  /** Pagination size. */
  size?: PaginationVariants["size"];
}

const PaginationRoot = <E extends keyof JSX.IntrinsicElements = "nav">({
  children,
  className,
  size,
  ...props
}: PaginationRootProps<E> & Omit<JSX.IntrinsicElements[E], keyof PaginationRootProps<E>>) => {
  const slots = React.useMemo(() => paginationVariants({size}), [size]);
  const contextValue = React.useMemo(() => ({slots}), [slots]);

  return (
    <PaginationContext value={contextValue}>
      <dom.nav
        aria-label="Pagination"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(props as any)}
        className={composeSlotClassName(slots.base, className)}
        data-slot="pagination"
      >
        {children}
      </dom.nav>
    </PaginationContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Pagination Summary
 * -----------------------------------------------------------------------------------------------*/
interface PaginationSummaryProps<
  E extends keyof JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children: ReactNode;
  className?: string;
}

const PaginationSummary = <E extends keyof JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: PaginationSummaryProps<E> & Omit<JSX.IntrinsicElements[E], keyof PaginationSummaryProps<E>>) => {
  const {slots} = use(PaginationContext);

  return (
    <dom.div
      // Base direction comes from the summary's own text, so mixed number/word content is not
      // bidi-reordered by an RTL ancestor. A consumer `dir` overrides it through the spread.
      dir="auto"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      className={composeSlotClassName(slots?.summary, className)}
      data-slot="pagination-summary"
    >
      {children}
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Pagination Content
 * -----------------------------------------------------------------------------------------------*/
interface PaginationContentProps<
  E extends keyof JSX.IntrinsicElements = "ul",
> extends DOMRenderProps<E, undefined> {
  children: ReactNode;
  className?: string;
}

const PaginationContent = <E extends keyof JSX.IntrinsicElements = "ul">({
  children,
  className,
  ...props
}: PaginationContentProps<E> & Omit<JSX.IntrinsicElements[E], keyof PaginationContentProps<E>>) => {
  const {slots} = use(PaginationContext);

  return (
    <dom.ul
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      className={composeSlotClassName(slots?.content, className)}
      data-slot="pagination-content"
    >
      {children}
    </dom.ul>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Pagination Item
 * -----------------------------------------------------------------------------------------------*/
interface PaginationItemProps<E extends keyof JSX.IntrinsicElements = "li"> extends DOMRenderProps<
  E,
  undefined
> {
  children: ReactNode;
  className?: string;
}

const PaginationItem = <E extends keyof JSX.IntrinsicElements = "li">({
  children,
  className,
  ...props
}: PaginationItemProps<E> & Omit<JSX.IntrinsicElements[E], keyof PaginationItemProps<E>>) => {
  const {slots} = use(PaginationContext);

  return (
    <dom.li
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      className={composeSlotClassName(slots?.item, className)}
      data-slot="pagination-item"
    >
      {children}
    </dom.li>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Pagination Link
 * -----------------------------------------------------------------------------------------------*/
interface PaginationLinkProps extends ComponentPropsWithRef<typeof ButtonPrimitive> {
  /** Marks the link as the current page: `aria-current="page"` and `data-active`. */
  isActive?: boolean;
}

const PaginationLink = ({children, className, isActive, ...props}: PaginationLinkProps) => {
  const {slots} = use(PaginationContext);

  return (
    <ButtonPrimitive
      aria-current={isActive ? "page" : undefined}
      data-active={isActive ? "true" : undefined}
      {...props}
      className={composeTwRenderProps(className, slots?.link())}
      data-slot="pagination-link"
    >
      {children}
    </ButtonPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Pagination Previous
 * -----------------------------------------------------------------------------------------------*/
interface PaginationPreviousProps extends ComponentPropsWithRef<typeof ButtonPrimitive> {}

const PaginationPrevious = ({children, className, ...props}: PaginationPreviousProps) => {
  const {slots} = use(PaginationContext);

  return (
    <ButtonPrimitive
      {...props}
      className={composeTwRenderProps(className, slots?.linkNav())}
      data-slot="pagination-previous"
    >
      {children}
    </ButtonPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Pagination Previous Icon
 * -----------------------------------------------------------------------------------------------*/
interface PaginationPreviousIconProps<
  E extends keyof JSX.IntrinsicElements = "span",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const PaginationPreviousIcon = <E extends keyof JSX.IntrinsicElements = "span">({
  children,
  className,
  ...props
}: PaginationPreviousIconProps<E> &
  Omit<JSX.IntrinsicElements[E], keyof PaginationPreviousIconProps<E>>) => {
  return (
    <dom.span
      aria-hidden="true"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      className={className}
      data-slot="pagination-previous-icon"
    >
      {children ?? <IconChevronLeft />}
    </dom.span>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Pagination Next
 * -----------------------------------------------------------------------------------------------*/
interface PaginationNextProps extends ComponentPropsWithRef<typeof ButtonPrimitive> {}

const PaginationNext = ({children, className, ...props}: PaginationNextProps) => {
  const {slots} = use(PaginationContext);

  return (
    <ButtonPrimitive
      {...props}
      className={composeTwRenderProps(className, slots?.linkNav())}
      data-slot="pagination-next"
    >
      {children}
    </ButtonPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Pagination Next Icon
 * -----------------------------------------------------------------------------------------------*/
interface PaginationNextIconProps<
  E extends keyof JSX.IntrinsicElements = "span",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const PaginationNextIcon = <E extends keyof JSX.IntrinsicElements = "span">({
  children,
  className,
  ...props
}: PaginationNextIconProps<E> &
  Omit<JSX.IntrinsicElements[E], keyof PaginationNextIconProps<E>>) => {
  return (
    <dom.span
      aria-hidden="true"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      className={className}
      data-slot="pagination-next-icon"
    >
      {children ?? <IconChevronRight />}
    </dom.span>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Pagination Ellipsis
 * -----------------------------------------------------------------------------------------------*/
interface PaginationEllipsisProps<
  E extends keyof JSX.IntrinsicElements = "span",
> extends DOMRenderProps<E, undefined> {
  className?: string;
}

const PaginationEllipsis = <E extends keyof JSX.IntrinsicElements = "span">({
  className,
  ...props
}: PaginationEllipsisProps<E> &
  Omit<JSX.IntrinsicElements[E], keyof PaginationEllipsisProps<E>>) => {
  const {slots} = use(PaginationContext);

  return (
    <dom.span
      aria-hidden="true"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      className={composeSlotClassName(slots?.ellipsis, className)}
      data-slot="pagination-ellipsis"
    >
      &hellip;
    </dom.span>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  PaginationRoot,
  PaginationSummary,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationPreviousIcon,
  PaginationNext,
  PaginationNextIcon,
  PaginationEllipsis,
};

export type {
  PaginationRootProps,
  PaginationSummaryProps,
  PaginationContentProps,
  PaginationItemProps,
  PaginationLinkProps,
  PaginationPreviousProps,
  PaginationPreviousIconProps,
  PaginationNextProps,
  PaginationNextIconProps,
  PaginationEllipsisProps,
};
