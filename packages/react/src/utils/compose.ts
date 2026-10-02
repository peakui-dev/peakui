"use client";

import {composeRenderProps} from "react-aria-components";
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
