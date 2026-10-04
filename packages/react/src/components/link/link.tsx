"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {LinkVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, ReactNode} from "react";

import {linkVariants} from "@peakui/styles";
import React, {createContext, use} from "react";
import {Link as LinkPrimitive} from "react-aria-components/Link";

import {dataAttr} from "../../utils/assertion.ts";
import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";
import {ExternalLinkIcon} from "../icons.tsx";

/* -------------------------------------------------------------------------------------------------
 * Link Context
 * -----------------------------------------------------------------------------------------------*/
type LinkContext = {
  slots?: ReturnType<typeof linkVariants>;
};

const LinkContext = createContext<LinkContext>({});

/* -------------------------------------------------------------------------------------------------
 * Link Root
 * -----------------------------------------------------------------------------------------------*/
interface LinkRootProps extends ComponentPropsWithRef<typeof LinkPrimitive>, LinkVariants {}

const LinkRoot = ({children, className, ...props}: LinkRootProps) => {
  const slots = React.useMemo(() => linkVariants(), []);
  const contextValue = React.useMemo(() => ({slots}), [slots]);

  return (
    <LinkContext value={contextValue}>
      <LinkPrimitive
        {...props}
        className={composeTwRenderProps(className, slots?.base())}
        data-slot="link"
      >
        {(values) => <>{typeof children === "function" ? children(values) : children}</>}
      </LinkPrimitive>
    </LinkContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Link Icon
 * -----------------------------------------------------------------------------------------------*/
interface LinkIconProps<
  E extends keyof React.JSX.IntrinsicElements = "span",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const LinkIcon = <E extends keyof React.JSX.IntrinsicElements = "span">({
  children,
  className,
  ...rest
}: LinkIconProps<E> & Omit<React.JSX.IntrinsicElements[E], keyof LinkIconProps<E>>) => {
  const {slots} = use(LinkContext);

  return (
    <dom.span
      className={composeSlotClassName(slots?.icon, className)}
      data-default-icon={dataAttr(!children)}
      /* The permitted `any`: the element type is a parameter, and the spread has erased it. */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(rest as any)}
      data-slot="link-icon"
    >
      {children ?? <ExternalLinkIcon data-slot="link-default-icon" />}
    </dom.span>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {LinkRoot, LinkIcon};

export type {LinkRootProps, LinkIconProps};
