"use client";

import type {AvatarVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {avatarVariants} from "@peakui/styles";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import React, {createContext, use} from "react";

import {composeSlotClassName} from "../../utils/compose.ts";
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
 * `asChild` is omitted: polymorphism in this library is a `render` prop, and Radix's root cannot
 * take one. It stays on `Avatar.Image`, where a framework image component is the one real use.
 */
interface AvatarRootProps
  extends
    Omit<ComponentPropsWithRef<typeof AvatarPrimitive.Root>, "asChild" | "color">,
    AvatarVariants {
  /** Set by `AvatarGroup` on its direct children; not for consumers. */
  [AVATAR_GROUP_CHILD]?: boolean;
  /** Names the `data-slot` when another part owns the root, as `AvatarGroup.Count` does. */
  [AVATAR_SLOT]?: string;
}

const AvatarRoot = ({
  children,
  className,
  color,
  size,
  variant,
  [AVATAR_GROUP_CHILD]: isAvatarGroupChild,
  [AVATAR_SLOT]: slot,
  ...props
}: AvatarRootProps) => {
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
interface AvatarImageProps extends ComponentPropsWithRef<typeof AvatarPrimitive.Image> {}

const AvatarImage = ({className, ...props}: AvatarImageProps) => {
  const {slots} = use(AvatarContext);

  return (
    <AvatarPrimitive.Image
      {...props}
      className={composeSlotClassName(slots?.image, className)}
      data-slot="avatar-image"
    />
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
