"use client";

import type {ButtonVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {buttonVariants} from "@peakui/styles";
import {use} from "react";
import {Button as ButtonPrimitive} from "react-aria-components/Button";

import {composeTwRenderProps} from "../../utils/compose.ts";
import {ButtonGroupContext} from "../button-group/index.ts";

/* -------------------------------------------------------------------------------------------------
 * Button Root
 * -------------------------------------------------------------------------------------------------
 * Тонкая стилизованная композиция над примитивом RAC. Поведение, фокус, клавиатура и ARIA —
 * его; здесь добавляются только имена и стиль.
 *
 * Inside a ButtonGroup the button inherits its `size`, `variant`, `isDisabled` and `fullWidth`
 * through the plain context-merge pattern toggle-button.tsx established: a direct prop always
 * wins (`isDisabled={false}` re-enables a button inside a disabled group). What stays dropped
 * from the reference is the BUTTON_GROUP_CHILD marker and the child cloning behind it: the
 * marker leaks a stray DOM attribute onto children, so the merge is depth-blind instead.
 *
 * isPending не требует кода: проп доезжает до примитива через spread, блокировку нажатия и
 * объявление состояния делает RAC, а стиль приходит из .button[data-pending] в @peakui/styles.
 * Индикатор ставит потребитель в children — см. историю Pending.
 * -----------------------------------------------------------------------------------------------*/
interface ButtonRootProps extends ComponentPropsWithRef<typeof ButtonPrimitive>, ButtonVariants {}

const ButtonRoot = ({
  children,
  className,
  fullWidth,
  isDisabled,
  isIconOnly,
  size,
  variant,
  ...rest
}: ButtonRootProps) => {
  const groupContext = use(ButtonGroupContext);

  // Merge props with precedence: direct props > context props
  const finalFullWidth = fullWidth ?? groupContext?.fullWidth;
  const finalIsDisabled = isDisabled ?? groupContext?.isDisabled;
  const finalSize = size ?? groupContext?.size;
  const finalVariant = variant ?? groupContext?.variant;

  const styles = buttonVariants({
    fullWidth: finalFullWidth,
    isIconOnly,
    size: finalSize,
    variant: finalVariant,
  });

  return (
    <ButtonPrimitive
      className={composeTwRenderProps(className, styles)}
      isDisabled={finalIsDisabled}
      {...rest}
      data-slot="button"
    >
      {(renderProps) => (typeof children === "function" ? children(renderProps) : children)}
    </ButtonPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {ButtonRoot};

export type {ButtonRootProps};
