"use client";

import type {ButtonVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {buttonVariants} from "@peakui/styles";
import {Button as ButtonPrimitive} from "react-aria-components/Button";

import {composeTwRenderProps} from "../../utils/compose.ts";

/* -------------------------------------------------------------------------------------------------
 * Button Root
 * -------------------------------------------------------------------------------------------------
 * Тонкая стилизованная композиция над примитивом RAC. Поведение, фокус, клавиатура и ARIA —
 * его; здесь добавляются только имена и стиль.
 *
 * Чего здесь сознательно нет по сравнению с эталоном: BUTTON_GROUP_CHILD, ButtonGroupContext и
 * слияние size / variant / isDisabled / fullWidth с контекстом группы. ButtonGroup вне границы
 * этой работы, а точка расширения под компонент, которого не существует, — это догадка.
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
  isIconOnly,
  size,
  variant,
  ...rest
}: ButtonRootProps) => {
  const styles = buttonVariants({fullWidth, isIconOnly, size, variant});

  return (
    <ButtonPrimitive
      className={composeTwRenderProps(className, styles)}
      data-slot="button"
      {...rest}
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
