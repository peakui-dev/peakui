"use client";

import type {AvatarGroupContextValue} from "./avatar-group-context.ts";
import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {AvatarGroupVariants, AvatarVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, JSX, ReactElement, ReactNode} from "react";

import {avatarGroupVariants} from "@peakui/styles";
import {Children, cloneElement, isValidElement, use, useMemo} from "react";

import {composeSlotClassName} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";
import {Avatar} from "../avatar/index.ts";

import {AVATAR_GROUP_CHILD, AVATAR_SLOT, AvatarGroupContext} from "./avatar-group-context.ts";

/* -------------------------------------------------------------------------------------------------
 * AvatarGroup Count
 * -----------------------------------------------------------------------------------------------*/
interface AvatarGroupCountProps extends Omit<
  ComponentPropsWithRef<typeof Avatar>,
  "children" | "color"
> {
  children?: ReactNode;
  /** Overrides the color the group passes down. */
  color?: AvatarVariants["color"];
}

const AvatarGroupCount = ({
  children,
  className,
  color,
  size,
  variant,
  ...props
}: AvatarGroupCountProps) => {
  const group = use(AvatarGroupContext);

  return (
    <Avatar
      {...props}
      {...{[AVATAR_SLOT]: "avatar-group-count"}}
      className={composeSlotClassName(group.slots?.count, className)}
      color={color ?? group.color}
      size={size ?? group.size}
      variant={variant ?? group.variant}
    >
      <Avatar.Fallback>{children}</Avatar.Fallback>
    </Avatar>
  );
};

const isCountElement = (element: ReactElement) => element.type === AvatarGroupCount;

/* -------------------------------------------------------------------------------------------------
 * AvatarGroup Root
 * -----------------------------------------------------------------------------------------------*/
interface AvatarGroupRootProps<E extends keyof JSX.IntrinsicElements = "div">
  extends DOMRenderProps<E, undefined>, AvatarGroupVariants {
  children?: ReactNode;
  className?: string;
  /**
   * Size applied to child Avatars (and the overflow count) when they omit size.
   * @default "md"
   */
  size?: AvatarVariants["size"];
  /** Color applied to child Avatars (and the overflow count) when they omit color. */
  color?: AvatarVariants["color"];
  /** Variant applied to child Avatars (and the overflow count) when they omit variant. */
  variant?: AvatarVariants["variant"];
  /**
   * Maximum number of avatar children to render.
   * Omit to show all children (no truncation).
   */
  max?: number;
  /**
   * How stacked avatars overlap visually.
   * - `"clip"` — crescent mask (transparent seam; no box-shadow)
   * - `"ring"` — solid box-shadow outline in the background color
   * Has no effect when `isGrid` is true.
   * @default "clip"
   */
  overlap?: AvatarGroupVariants["overlap"];
}

const AvatarGroupRoot = <E extends keyof JSX.IntrinsicElements = "div">({
  children,
  className,
  color,
  isGrid = false,
  max,
  overlap = "clip",
  size = "md",
  variant,
  ...props
}: AvatarGroupRootProps<E> & Omit<JSX.IntrinsicElements[E], keyof AvatarGroupRootProps<E>>) => {
  const slots = useMemo(() => avatarGroupVariants({isGrid, overlap}), [isGrid, overlap]);

  const context = useMemo<AvatarGroupContextValue>(
    () => ({color, size, slots, variant}),
    [color, size, slots, variant],
  );

  const avatarChildren: ReactElement[] = [];
  const countChildren: ReactElement[] = [];

  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;
    if (isCountElement(child)) countChildren.push(child);
    else avatarChildren.push(child);
  }

  const visibleChildren = max == null ? avatarChildren : avatarChildren.slice(0, Math.max(0, max));
  const remaining = avatarChildren.length - visibleChildren.length;

  /*
   * The marker tells a child Avatar it sits directly in the group. A host element has no use for
   * it, and it would reach the DOM as an attribute React does not recognize.
   */
  const markedChildren = visibleChildren.map((child) =>
    typeof child.type === "string"
      ? child
      : cloneElement(child as ReactElement<Record<string, unknown>>, {[AVATAR_GROUP_CHILD]: true}),
  );

  const countContent =
    countChildren.length > 0
      ? countChildren
      : remaining > 0 && <AvatarGroupCount>{`+${remaining}`}</AvatarGroupCount>;

  return (
    <AvatarGroupContext value={context}>
      <dom.div
        /*
         * The permitted `any`: the element type is a parameter, and the spread has erased it.
         * references/typescript.md, the polymorphic spread boundary.
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(props as any)}
        className={composeSlotClassName(slots.base, className)}
        data-slot="avatar-group"
      >
        {markedChildren}
        {countContent}
      </dom.div>
    </AvatarGroupContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {AvatarGroupRoot, AvatarGroupCount};

export type {AvatarGroupRootProps, AvatarGroupCountProps};
