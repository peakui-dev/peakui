"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {JSX, ReactNode} from "react";

import {fieldsetVariants} from "@peakui/styles";
import {createContext, use, useMemo} from "react";
import {ButtonContext} from "react-aria-components/Button";
import {CheckboxGroupContext} from "react-aria-components/CheckboxGroup";
import {LinkContext} from "react-aria-components/Link";
import {RadioGroupContext} from "react-aria-components/RadioGroup";
import {SliderContext} from "react-aria-components/Slider";
import {Provider} from "react-aria-components/slots";
import {ToggleButtonContext} from "react-aria-components/ToggleButton";
import {ToggleButtonGroupContext} from "react-aria-components/ToggleButtonGroup";

import {composeSlotClassName} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";

/* -------------------------------------------------------------------------------------------------
 * Fieldset Context
 * -----------------------------------------------------------------------------------------------*/
interface FieldsetContextValue {
  slots?: ReturnType<typeof fieldsetVariants>;
}

const FieldsetContext = createContext<FieldsetContextValue>({});

/*
 * Общая форма части: обычный DOM-элемент с полиморфизмом через render-проп. Примитива RAC под
 * группой полей нет — её семантику несёт сам <fieldset>.
 */
type PartProps<E extends keyof JSX.IntrinsicElements> = DOMRenderProps<E, undefined> & {
  children?: ReactNode;
  className?: string;
} & Omit<JSX.IntrinsicElements[E], "children" | "className">;

/* -------------------------------------------------------------------------------------------------
 * Fieldset Root
 * -------------------------------------------------------------------------------------------------
 * Нативный <fieldset disabled> дизейблит вложенные контролы формы силами браузера, и этого не хватает
 * дважды:
 *
 * 1. Примитивы RAC, которые рендерятся как <div> (Slider, RadioGroup, CheckboxGroup), контролами
 *    формы не являются — браузер их не трогает, и они остаются интерактивными.
 * 2. У тех, кого браузер дизейблит (Button, ToggleButton, Link), внутреннее состояние isDisabled в
 *    RAC обновляется только из пропа или контекста. Без проброса кнопка не нажимается, а её
 *    render-проп продолжает возвращать isDisabled: false.
 *
 * Отсюда семь контекстов. Шести из них соответствующего компонента в peakui пока нет, и это не
 * нарушает правило «не делать точек расширения под несуществующее»: контексты принадлежат
 * react-aria-components, которая уже в зависимостях, и голый RAC Checkbox внутри нашего Fieldset
 * потребитель может положить сегодня. Решение зафиксировано в спеке
 * 2026-10-03-input-field-family-design, раздел 2.7.
 * -----------------------------------------------------------------------------------------------*/
interface FieldsetRootProps<
  E extends keyof JSX.IntrinsicElements = "fieldset",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const FieldsetRoot = <E extends keyof JSX.IntrinsicElements = "fieldset">({
  children,
  className,
  ...rest
}: PartProps<E> & FieldsetRootProps<E>) => {
  const slots = useMemo(() => fieldsetVariants(), []);
  const contextValue = useMemo(() => ({slots}), [slots]);
  const isDisabled = "disabled" in rest && rest.disabled === true;

  return (
    <FieldsetContext value={contextValue}>
      <dom.fieldset
        className={slots.base({className})}
        data-disabled={isDisabled || undefined}
        /*
         * Единственный разрешённый в пакете any — граница полиморфного spread'а: тип элемента здесь
         * параметр, который spread уже стёр. Условия исключения — references/typescript.md.
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(rest as any)}
        data-slot="fieldset"
      >
        {isDisabled ? (
          <Provider
            values={[
              [ButtonContext, {isDisabled: true}],
              [CheckboxGroupContext, {isDisabled: true}],
              [LinkContext, {isDisabled: true}],
              [RadioGroupContext, {isDisabled: true}],
              [SliderContext, {isDisabled: true}],
              [ToggleButtonContext, {isDisabled: true}],
              [ToggleButtonGroupContext, {isDisabled: true}],
            ]}
          >
            {children}
          </Provider>
        ) : (
          children
        )}
      </dom.fieldset>
    </FieldsetContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Fieldset Legend
 * -----------------------------------------------------------------------------------------------*/
const FieldsetLegend = <E extends keyof JSX.IntrinsicElements = "legend">({
  className,
  ...rest
}: PartProps<E>) => {
  const {slots} = use(FieldsetContext);

  return (
    <dom.legend
      className={composeSlotClassName(slots?.legend, className)}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(rest as any)}
      data-slot="fieldset-legend"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Fieldset Group
 * -------------------------------------------------------------------------------------------------
 * Плоское имя — FieldsetGroup, а не FieldGroup как у эталона: все части в библиотеке носят префикс
 * своего компонента, а FieldGroup в корневой бочке столкнулся бы с будущим одноимённым компонентом.
 * Ключ пространства имён остался Group, поэтому <Fieldset.Group> совпадает с эталоном.
 * -----------------------------------------------------------------------------------------------*/
const FieldsetGroup = <E extends keyof JSX.IntrinsicElements = "div">({
  className,
  ...rest
}: PartProps<E>) => {
  const {slots} = use(FieldsetContext);

  return (
    <dom.div
      className={composeSlotClassName(slots?.group, className)}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(rest as any)}
      data-slot="fieldset-group"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Fieldset Actions
 * -----------------------------------------------------------------------------------------------*/
const FieldsetActions = <E extends keyof JSX.IntrinsicElements = "div">({
  className,
  ...rest
}: PartProps<E>) => {
  const {slots} = use(FieldsetContext);

  return (
    <dom.div
      className={composeSlotClassName(slots?.actions, className)}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(rest as any)}
      data-slot="fieldset-actions"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {FieldsetRoot, FieldsetLegend, FieldsetGroup, FieldsetActions};

export type {FieldsetRootProps, PartProps as FieldsetPartProps};
