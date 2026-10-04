"use client";

import type {CloseButtonVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {closeButtonVariants} from "@peakui/styles";
import {useMemo} from "react";
import {Button as ButtonPrimitive} from "react-aria-components/Button";

import {composeTwRenderProps} from "../../utils/compose.ts";
import {CloseIcon} from "../icons.tsx";

/* -------------------------------------------------------------------------------------------------
 * CloseButton Root
 * -------------------------------------------------------------------------------------------------
 * A thin styled composition over the RAC Button primitive: an icon-only dismiss control. Behavior,
 * focus, keyboard and ARIA are the primitive's; this adds the name, the class names and the
 * default glyph. `Button` (the library's own) is deliberately not composed — the reference
 * composes the RAC primitive directly, and a close button wants none of Button's variants.
 * -----------------------------------------------------------------------------------------------*/
interface CloseButtonRootProps
  extends ComponentPropsWithRef<typeof ButtonPrimitive>, CloseButtonVariants {}

const CloseButtonRoot = ({
  children,
  className,
  slot,
  style,
  variant,
  ...rest
}: CloseButtonRootProps) => {
  const styles = useMemo(() => closeButtonVariants({variant}), [variant]);

  return (
    <ButtonPrimitive
      /*
       * The spread below comes AFTER aria-label on purpose: an icon-only control must be named,
       * and a consumer-supplied label always wins over the default. Swap the order and "Close"
       * is set in stone.
       */
      aria-label="Close"
      className={composeTwRenderProps(className, styles)}
      data-slot="close-button"
      slot={slot}
      style={style}
      type="button"
      {...rest}
    >
      {(renderProps) =>
        typeof children === "function"
          ? children(renderProps)
          : (children ?? <CloseIcon data-slot="close-button-icon" />)
      }
    </ButtonPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {CloseButtonRoot};

export type {CloseButtonRootProps};
