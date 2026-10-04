"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {SpinnerVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, JSX} from "react";

import {spinnerVariants} from "@peakui/styles";
import {useId} from "react";

import {dom} from "../../utils/dom.tsx";

/* -------------------------------------------------------------------------------------------------
 * Internal
 * -------------------------------------------------------------------------------------------------
 * Spinner Primitive
 * -----------------------------------------------------------------------------------------------*/
interface SpinnerPrimitiveProps extends ComponentPropsWithRef<"svg"> {}

/*
 * Градиенты адресуются по id, а id в SVG глобальны для документа. Без useId() два спиннера на
 * одной странице указывали бы на одно определение, и второй отрисовался бы пустым. Эталон решает
 * это так же.
 */
const SpinnerPrimitive = ({...props}: SpinnerPrimitiveProps) => {
  const id = useId();

  return (
    <svg viewBox="0 0 24 24" {...props} data-slot="spinner-icon">
      <defs>
        <linearGradient id={`spinner-grad-1-${id}`} x1="50%" x2="50%" y1="5.271%" y2="91.793%">
          <stop offset="0%" stopColor="currentColor" />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0.55} />
        </linearGradient>
        <linearGradient id={`spinner-grad-2-${id}`} x1="50%" x2="50%" y1="15.24%" y2="87.15%">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0.55} />
        </linearGradient>
      </defs>
      <g fill="none">
        <path
          d="M8.749.021a1.5 1.5 0 0 1 .497 2.958A7.5 7.5 0 0 0 3 10.375a7.5 7.5 0 0 0 7.5 7.5v3c-5.799 0-10.5-4.7-10.5-10.5C0 5.23 3.726.865 8.749.021"
          fill={`url(#spinner-grad-1-${id})`}
          transform="translate(1.5 1.625)"
        />
        <path
          d="M15.392 2.673a1.5 1.5 0 0 1 2.119-.115A10.48 10.48 0 0 1 21 10.375c0 5.8-4.701 10.5-10.5 10.5v-3a7.5 7.5 0 0 0 5.007-13.084a1.5 1.5 0 0 1-.115-2.118"
          fill={`url(#spinner-grad-2-${id})`}
          transform="translate(1.5 1.625)"
        />
      </g>
    </svg>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Spinner Root
 * -----------------------------------------------------------------------------------------------*/
interface SpinnerRootProps<E extends keyof JSX.IntrinsicElements = "span"> extends DOMRenderProps<
  E,
  undefined
> {
  className?: string;
  /** Цвет спиннера. */
  color?: SpinnerVariants["color"];
  /** Размер спиннера. */
  size?: SpinnerVariants["size"];
}

const SpinnerRoot = <E extends keyof JSX.IntrinsicElements = "span">({
  className,
  color,
  size,
  ...props
}: SpinnerRootProps<E> & Omit<JSX.IntrinsicElements[E], keyof SpinnerRootProps<E>>) => {
  return (
    <dom.span
      aria-label="Loading"
      role="status"
      /*
       * props разливаются ПОСЛЕ aria-label, и это не косметика: именно так переданная
       * потребителем метка перебивает дефолт. Переставить местами — значит зашить «Loading»
       * намертво. Разрешённое место для any: тип элемента здесь параметр, который spread стёр.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      className={spinnerVariants({className, color, size})}
      data-slot="spinner"
    >
      <SpinnerPrimitive aria-hidden />
    </dom.span>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {SpinnerRoot};

export type {SpinnerRootProps};
