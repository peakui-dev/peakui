"use client";

import type {FieldVariant} from "../../contexts/field-variant.ts";
import type {TextFieldVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {textFieldVariants} from "@peakui/styles";
import {useMemo} from "react";
import {TextField as TextFieldPrimitive} from "react-aria-components/TextField";

import {FieldVariantContext} from "../../contexts/field-variant.ts";
import {composeTwRenderProps} from "../../utils/compose.ts";

/* -------------------------------------------------------------------------------------------------
 * TextField Root
 * -------------------------------------------------------------------------------------------------
 * Корень поля: значение, валидация и связка id с подписью, описанием и сообщением — забота
 * примитива RAC, который публикует descriptionProps и errorMessageProps как слоты TextContext.
 * Здесь добавляются имена, раскладка и наследование варианта.
 *
 * Контекст провайдится ВСЕГДА, в том числе со variant: undefined. Это не формальность: именно так
 * вложенное поле сбрасывает вариант внешнего, вместо того чтобы молча его унаследовать.
 * -----------------------------------------------------------------------------------------------*/
interface TextFieldRootProps
  extends ComponentPropsWithRef<typeof TextFieldPrimitive>, TextFieldVariants {
  /**
   * Вариант поверхности поля. Доезжает до Input и InputGroup через FieldVariantContext.
   * @default "primary"
   */
  variant?: FieldVariant;
}

const TextFieldRoot = ({children, className, fullWidth, variant, ...rest}: TextFieldRootProps) => {
  const styles = textFieldVariants({fullWidth});
  const contextValue = useMemo(() => ({variant}), [variant]);

  return (
    <TextFieldPrimitive
      className={composeTwRenderProps(className, styles)}
      {...rest}
      data-slot="textfield"
    >
      {(renderProps) => (
        /*
         * Провайдер внутри children-функции примитива, а не вокруг него: render-пропы RAC обязаны
         * разрешиться первыми, иначе части поля получат контекст раньше состояния.
         */
        <FieldVariantContext value={contextValue}>
          {typeof children === "function" ? children(renderProps) : children}
        </FieldVariantContext>
      )}
    </TextFieldPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {TextFieldRoot};

export type {TextFieldRootProps};
