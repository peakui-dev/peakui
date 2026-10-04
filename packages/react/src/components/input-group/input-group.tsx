"use client";

import type {InputGroupVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, MouseEvent} from "react";

import {inputGroupVariants} from "@peakui/styles";
import {mergeRefs} from "@react-aria/utils";
import {createContext, use, useMemo, useRef} from "react";
import {Group as GroupPrimitive} from "react-aria-components/Group";
import {Input as InputPrimitive} from "react-aria-components/Input";
import {TextArea as TextAreaPrimitive} from "react-aria-components/TextArea";

import {useFieldVariant} from "../../contexts/field-variant.ts";
import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";

/* -------------------------------------------------------------------------------------------------
 * InputGroup Context
 * -------------------------------------------------------------------------------------------------
 * Рецепт вызывается один раз в корне, части берут из контекста свой слот. Вызов на часть означал бы
 * столько наборов вариантов, сколько частей, и они бы разошлись.
 * -----------------------------------------------------------------------------------------------*/
interface InputGroupContextValue {
  slots?: ReturnType<typeof inputGroupVariants>;
}

const InputGroupContext = createContext<InputGroupContextValue>({});

/*
 * Что считается «кликом по своему контролу»: сам контрол и любой интерактивный элемент внутри
 * оболочки. Клик по кнопке в суффиксе принадлежит кнопке, и перевод фокуса на поле его украл бы.
 */
const INTERACTIVE = [
  "input",
  "textarea",
  "select",
  "button",
  "label",
  "a[href]",
  "[role='button']",
  "[role='link']",
  "[role='checkbox']",
  "[role='switch']",
  "[role='radio']",
  "[role='menuitem']",
  "[role='combobox']",
  "[tabindex]:not([tabindex='-1'])",
  "[contenteditable]:not([contenteditable='false'])",
].join(", ");

/*
 * Контрол группы опознаётся по своему data-slot, а не как «первый input в поддереве». Разница не
 * теоретическая: интерактивный контрол в префиксе — select-all чекбокс, переключатель видимости
 * пароля — стоит в документе раньше и забирал бы фокус себе. Те же два значения уже ключуют правила
 * в input-group.css, так что JS и CSS теперь говорят об одном элементе.
 */
const CONTROL = '[data-slot="input-group-input"], [data-slot="input-group-textarea"]';

/* -------------------------------------------------------------------------------------------------
 * InputGroup Root
 * -------------------------------------------------------------------------------------------------
 * Оболочка — RAC Group. Внутри поля она получает isInvalid и isDisabled без нашего кода: их отдаёт
 * GroupContext, который провайдит сам RAC TextField (dist/private/TextField.js) — поэтому здесь нет
 * ни чтения состояния валидации, ни его проброса.
 * -----------------------------------------------------------------------------------------------*/
interface InputGroupRootProps
  extends ComponentPropsWithRef<typeof GroupPrimitive>, InputGroupVariants {}

const InputGroupRoot = ({
  children,
  className,
  fullWidth,
  onClick,
  ref,
  variant,
  ...rest
}: InputGroupRootProps) => {
  const inherited = useFieldVariant();
  const ownRef = useRef<HTMLDivElement>(null);

  const slots = useMemo(
    () => inputGroupVariants({fullWidth, variant: variant ?? inherited.variant}),
    [fullWidth, inherited.variant, variant],
  );
  const contextValue = useMemo(() => ({slots}), [slots]);
  /*
   * mergeRefs в useMemo, а не стрелка в JSX: собранный заново на каждый рендер ref React отцепляет
   * (зовёт с null) и прицепляет обратно. У контролируемого поля это один цикл отцепа на нажатие
   * клавиши, то есть снос и пересборка любого побочного эффекта в ref-колбэке потребителя —
   * ResizeObserver, setState, регистрация в floating-ui. utils/dom.tsx делает это так же.
   */
  const mergedRef = useMemo(() => mergeRefs(ref, ownRef), [ref]);

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;

    /*
     * Оба слота: эталон ищет только "input", поэтому у него клик по префиксу рядом с многострочным
     * контролом не ставит фокус никуда.
     */
    const control = ownRef.current?.querySelector<HTMLElement>(CONTROL);

    if (control && !target.closest(INTERACTIVE)) {
      control.focus();
    }

    onClick?.(event);
  };

  return (
    <InputGroupContext value={contextValue}>
      <GroupPrimitive
        {...rest}
        ref={mergedRef}
        className={composeTwRenderProps(className, slots.base())}
        data-slot="input-group"
        onClick={handleClick}
      >
        {(renderProps) => (typeof children === "function" ? children(renderProps) : children)}
      </GroupPrimitive>
    </InputGroupContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * InputGroup Input
 * -----------------------------------------------------------------------------------------------*/
interface InputGroupInputProps extends ComponentPropsWithRef<typeof InputPrimitive> {}

const InputGroupInput = ({className, ...rest}: InputGroupInputProps) => {
  const {slots} = use(InputGroupContext);

  return (
    <InputPrimitive
      className={composeTwRenderProps(className, slots?.input())}
      {...rest}
      data-slot="input-group-input"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * InputGroup TextArea
 * -------------------------------------------------------------------------------------------------
 * Делит класс с однострочным контролом: отличия висят на data-slot, см. input-group.css.
 * -----------------------------------------------------------------------------------------------*/
interface InputGroupTextAreaProps extends ComponentPropsWithRef<typeof TextAreaPrimitive> {}

const InputGroupTextArea = ({className, ...rest}: InputGroupTextAreaProps) => {
  const {slots} = use(InputGroupContext);

  return (
    <TextAreaPrimitive
      className={composeTwRenderProps(className, slots?.input())}
      {...rest}
      data-slot="input-group-textarea"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * InputGroup Prefix
 * -------------------------------------------------------------------------------------------------
 * Обычный div, а не примитив RAC: слот несёт оформление, а не поведение. Кнопка, положенная в него
 * потребителем, сохраняет свою семантику целиком — это и есть замысел.
 * -----------------------------------------------------------------------------------------------*/
interface InputGroupPrefixProps extends ComponentPropsWithRef<"div"> {}

const InputGroupPrefix = ({children, className, ...rest}: InputGroupPrefixProps) => {
  const {slots} = use(InputGroupContext);

  return (
    <div
      className={composeSlotClassName(slots?.prefix, className)}
      {...rest}
      data-slot="input-group-prefix"
    >
      {children}
    </div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * InputGroup Suffix
 * -----------------------------------------------------------------------------------------------*/
interface InputGroupSuffixProps extends ComponentPropsWithRef<"div"> {}

const InputGroupSuffix = ({children, className, ...rest}: InputGroupSuffixProps) => {
  const {slots} = use(InputGroupContext);

  return (
    <div
      className={composeSlotClassName(slots?.suffix, className)}
      {...rest}
      data-slot="input-group-suffix"
    >
      {children}
    </div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {InputGroupRoot, InputGroupInput, InputGroupTextArea, InputGroupPrefix, InputGroupSuffix};

export type {
  InputGroupRootProps,
  InputGroupInputProps,
  InputGroupTextAreaProps,
  InputGroupPrefixProps,
  InputGroupSuffixProps,
};
