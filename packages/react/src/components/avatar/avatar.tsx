"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {AvatarVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {avatarVariants} from "@peakui/styles";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import React, {createContext, use} from "react";

import {composeSlotClassName} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";
import {
  AVATAR_GROUP_CHILD,
  AVATAR_SLOT,
  AvatarGroupContext,
} from "../avatar-group/avatar-group-context.ts";

/* -------------------------------------------------------------------------------------------------
 * Avatar Context
 * -----------------------------------------------------------------------------------------------*/
type AvatarContext = {
  slots?: ReturnType<typeof avatarVariants>;
};

const AvatarContext = createContext<AvatarContext>({});

/* -------------------------------------------------------------------------------------------------
 * Avatar Root
 * -----------------------------------------------------------------------------------------------*/
/*
 * `asChild` is omitted: polymorphism in this library is a `render` prop. Only `Avatar.Image` has
 * one, mapped onto `asChild` below; a root that is a different element has no use in an avatar.
 */
interface AvatarRootProps
  extends
    Omit<ComponentPropsWithRef<typeof AvatarPrimitive.Root>, "asChild" | "color">,
    AvatarVariants {}

/*
 * The two markers `AvatarGroup` writes onto its parts. They are not part of `AvatarRootProps`, so
 * no consumer type, `Avatar["Props"]` or `AvatarGroup.Count` prop list carries them, and neither
 * constant leaves the package: `AvatarRoot` reads them from the props object it is handed.
 */
interface AvatarMarkers {
  [AVATAR_GROUP_CHILD]?: boolean;
  [AVATAR_SLOT]?: string;
}

const AvatarRoot = (allProps: AvatarRootProps) => {
  const {
    children,
    className,
    color,
    size,
    variant,
    [AVATAR_GROUP_CHILD]: isAvatarGroupChild,
    [AVATAR_SLOT]: slot,
    ...props
  } = allProps as AvatarRootProps & AvatarMarkers;

  const avatarGroupContext = use(AvatarGroupContext);

  // Only use group context when this avatar is a direct child of AvatarGroup
  const shouldUseContext = isAvatarGroupChild === true;

  // Merge props with precedence: direct props > context props
  const finalSize = size ?? (shouldUseContext ? avatarGroupContext.size : undefined);
  const finalColor = color ?? (shouldUseContext ? avatarGroupContext.color : undefined);
  const finalVariant = variant ?? (shouldUseContext ? avatarGroupContext.variant : undefined);

  const slots = React.useMemo(
    () => avatarVariants({color: finalColor, size: finalSize, variant: finalVariant}),
    [finalColor, finalSize, finalVariant],
  );
  const contextValue = React.useMemo(() => ({slots}), [slots]);

  return (
    <AvatarContext value={contextValue}>
      <AvatarPrimitive.Root
        {...props}
        className={composeSlotClassName(slots.base, className)}
        data-slot={slot ?? "avatar"}
      >
        {children}
      </AvatarPrimitive.Root>
    </AvatarContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Avatar Image
 * -----------------------------------------------------------------------------------------------*/
/*
 * `render` replaces Radix's `asChild`: the house pattern for polymorphism. It is mapped onto
 * `asChild` here, with a `dom.img` as the single child that Radix merges its props into, so the
 * loading status is still tracked from `src` and the image still appears only once loaded.
 */
interface AvatarImageProps
  extends
    Omit<ComponentPropsWithRef<typeof AvatarPrimitive.Image>, "asChild">,
    DOMRenderProps<"img", undefined> {}

const AvatarImage = ({className, render, ...props}: AvatarImageProps) => {
  const {slots} = use(AvatarContext);

  return (
    <AvatarPrimitive.Image
      {...props}
      asChild={render ? true : undefined}
      className={composeSlotClassName(slots?.image, className)}
      data-slot="avatar-image"
    >
      {render ? <dom.img render={render} /> : undefined}
    </AvatarPrimitive.Image>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Avatar Fallback
 * -----------------------------------------------------------------------------------------------*/
interface AvatarFallbackProps extends Omit<
  ComponentPropsWithRef<typeof AvatarPrimitive.Fallback>,
  "asChild"
> {
  /** Overrides the color the Avatar passes down. */
  color?: AvatarVariants["color"];
}

const AvatarFallback = ({className, color, ...props}: AvatarFallbackProps) => {
  const {slots} = use(AvatarContext);

  return (
    <AvatarPrimitive.Fallback
      {...props}
      className={composeSlotClassName(slots?.fallback, className, {color})}
      data-slot="avatar-fallback"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {AvatarRoot, AvatarImage, AvatarFallback};

export type {AvatarRootProps, AvatarImageProps, AvatarFallbackProps};
