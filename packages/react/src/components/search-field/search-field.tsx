"use client";

import type {FieldVariant} from "../../contexts/field-variant.ts";
import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {SearchFieldVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {searchFieldVariants} from "@peakui/styles";
import {cloneElement, createContext, isValidElement, use, useMemo} from "react";
import {Group as GroupPrimitive} from "react-aria-components/Group";
import {Input as InputPrimitive} from "react-aria-components/Input";
import {SearchField as SearchFieldPrimitive} from "react-aria-components/SearchField";

import {FieldVariantContext, useFieldVariant} from "../../contexts/field-variant.ts";
import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {CloseButton} from "../close-button/index.ts";
import {IconSearch} from "../icons.tsx";

/* -------------------------------------------------------------------------------------------------
 * SearchField Context
 * -------------------------------------------------------------------------------------------------
 * Рецепт вызывается один раз в корне, части берут из контекста свой слот — как в InputGroup: вызов
 * на часть означал бы столько наборов вариантов, сколько частей, и они бы разошлись.
 * -----------------------------------------------------------------------------------------------*/
interface SearchFieldContextValue {
  slots?: ReturnType<typeof searchFieldVariants>;
}

const SearchFieldContext = createContext<SearchFieldContextValue>({});

/* -------------------------------------------------------------------------------------------------
 * SearchField Root
 * -----------------------------------------------------------------------------------------------*/
interface SearchFieldRootProps
  extends ComponentPropsWithRef<typeof SearchFieldPrimitive>, SearchFieldVariants {
  /**
   * Вариант поверхности поля. Доезжает до Group и до вложенных листьев через FieldVariantContext.
   * @default "primary"
   */
  variant?: FieldVariant;
}

const SearchFieldRoot = ({
  children,
  className,
  fullWidth,
  variant,
  ...rest
}: SearchFieldRootProps) => {
  /*
   * Разрешение варианта — как в InputGroupRoot: собственный проп, иначе ближайший провайдер.
   * FieldVariantContext ниже провайдит СЫРОЙ проп (возможно undefined), а не разрешённый: именно
   * это сбрасывает наследование у вложенного поля — контракт спеки семейства полей, раздел 1.1.
   */
  const inherited = useFieldVariant();
  const slots = useMemo(
    () => searchFieldVariants({fullWidth, variant: variant ?? inherited.variant}),
    [fullWidth, inherited.variant, variant],
  );
  const contextValue = useMemo(() => ({slots}), [slots]);
  const fieldVariantValue = useMemo(() => ({variant}), [variant]);

  return (
    <SearchFieldContext value={contextValue}>
      <SearchFieldPrimitive
        className={composeTwRenderProps(className, slots?.base())}
        {...rest}
        data-slot="search-field"
      >
        {(renderProps) => (
          /*
           * Провайдер внутри children-функции примитива, а не вокруг него: render-пропы RAC обязаны
           * разрешиться первыми, иначе части поля получат контекст раньше состояния. Так же делает
           * TextFieldRoot.
           */
          <FieldVariantContext value={fieldVariantValue}>
            {typeof children === "function" ? children(renderProps) : children}
          </FieldVariantContext>
        )}
      </SearchFieldPrimitive>
    </SearchFieldContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * SearchField Group
 * -----------------------------------------------------------------------------------------------*/
interface SearchFieldGroupProps extends ComponentPropsWithRef<typeof GroupPrimitive> {}

const SearchFieldGroup = ({children, className, ...rest}: SearchFieldGroupProps) => {
  const {slots} = use(SearchFieldContext);

  return (
    <GroupPrimitive
      className={composeTwRenderProps(className, slots?.group())}
      {...rest}
      data-slot="search-field-group"
    >
      {(renderProps) => (typeof children === "function" ? children(renderProps) : children)}
    </GroupPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * SearchField Input
 * -----------------------------------------------------------------------------------------------*/
interface SearchFieldInputProps extends ComponentPropsWithRef<typeof InputPrimitive> {}

const SearchFieldInput = ({className, ...rest}: SearchFieldInputProps) => {
  const {slots} = use(SearchFieldContext);

  return (
    <InputPrimitive
      className={composeTwRenderProps(className, slots?.input())}
      {...rest}
      data-slot="search-field-input"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * SearchField Search Icon
 * -----------------------------------------------------------------------------------------------*/
interface SearchFieldSearchIconProps<
  E extends keyof React.JSX.IntrinsicElements = "svg",
> extends DOMRenderProps<E, undefined> {
  children?: React.ReactNode;
  className?: string;
}

const SearchFieldSearchIcon = <E extends keyof React.JSX.IntrinsicElements = "svg">({
  children,
  className,
  ...props
}: SearchFieldSearchIconProps<E> &
  Omit<React.JSX.IntrinsicElements[E], keyof SearchFieldSearchIconProps<E>>) => {
  const {slots} = use(SearchFieldContext);

  if (children && isValidElement(children)) {
    return cloneElement(
      children as React.ReactElement<{
        className?: string;
        "data-slot"?: string;
      }>,
      {
        /*
         * Граница полиморфного spread'а: тип элемента — параметр, который spread уже стёр.
         * Условия исключения — references/typescript.md.
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(props as any),
        className: composeSlotClassName(slots?.searchIcon, className),
        "data-slot": "search-field-search-icon",
      },
    );
  }

  return (
    <IconSearch
      className={composeSlotClassName(slots?.searchIcon, className)}
      /* Граница полиморфного spread'а — та же, что выше. */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="search-field-search-icon"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * SearchField Clear Button
 * -----------------------------------------------------------------------------------------------*/
interface SearchFieldClearButtonProps extends ComponentPropsWithRef<typeof CloseButton> {}

const SearchFieldClearButton = ({className, ...rest}: SearchFieldClearButtonProps) => {
  const {slots} = use(SearchFieldContext);

  return (
    <CloseButton
      className={composeTwRenderProps(className, slots?.clearButton())}
      slot="clear"
      {...rest}
      data-slot="search-field-clear-button"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  SearchFieldRoot,
  SearchFieldGroup,
  SearchFieldInput,
  SearchFieldSearchIcon,
  SearchFieldClearButton,
};

export type {
  SearchFieldRootProps,
  SearchFieldGroupProps,
  SearchFieldInputProps,
  SearchFieldSearchIconProps,
  SearchFieldClearButtonProps,
};
