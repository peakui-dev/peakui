"use client";

import {composeRenderProps} from "react-aria-components/composeRenderProps";
import {cx} from "tailwind-variants";

/*
 * Единственная точка, где потребительский className встречается с BEM-именами библиотеки.
 * Слияние, а не замена: className, пришедший строкой или функцией render-пропа RAC, добавляется
 * к именам варианта. Утилиты как JS-строки эталон экспортирует из src/utils/index.ts — здесь их
 * нет осознанно, они живут в utilities/index.css и берутся через @apply. Причина —
 * docs/superpowers/specs/2026-10-02-composition-contract-design.md, раздел 3.
 */
export function composeTwRenderProps<T>(
  className: string | ((v: T) => string) | undefined,
  tailwind?: string | ((v: T) => string | undefined),
): string | ((v: T) => string) {
  return composeRenderProps(className, (resolved, renderProps): string => {
    const tw = typeof tailwind === "function" ? (tailwind(renderProps) ?? "") : (tailwind ?? "");

    return cx(tw, resolved ?? "") ?? "";
  });
}

/** Аргументы слот-функции: её собственные варианты плюс className потребителя. */
type SlotArgs = Record<string, unknown> & {className?: string};

/*
 * Композиция className для одного слота многослотового компонента. Слот-функция приходит из
 * tv({slots}) и сама знает своё BEM-имя; здесь к ней добавляются варианты и className
 * потребителя — так же, как composeTwRenderProps делает это для Root.
 *
 * Эталон типизирует подпись через any. Здесь unknown: это не граница полиморфного spread'а, и
 * исключение для any на неё не распространяется.
 */
export function composeSlotClassName(
  slotFn: ((args?: SlotArgs) => string) | undefined,
  className?: string,
  variants?: Record<string, unknown>,
): string | undefined {
  return typeof slotFn === "function" ? slotFn({...variants, className}) : className;
}
