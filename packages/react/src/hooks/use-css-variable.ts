"use client";

import {useIsSSR} from "@react-aria/ssr";
import {useMemo} from "react";

/*
 * Кеш значений CSS-переменных: чтение через getComputedStyle — это обращение к DOM, а значения
 * вроде --tooltip-delay читаются при каждом рендере Root'а. Ключ — имя переменной; тема меняется
 * перезаписью значения на :root, и кеш хранит последнее прочитанное.
 */
const cssVariableCache = new Map<string, string | undefined>();

/**
 * Читает значение CSS-свойства с `document.documentElement`: безопасно на SSR (вернёт undefined),
 * умеет закешировать и уступить место override, если тот передан.
 *
 * @param variableName - имя переменной, например `--tooltip-delay`
 * @param override - значение, которое перебивает переменную, если задано
 * @param cache - кешировать ли чтение (по умолчанию да)
 * @returns значение переменной, override или undefined
 */
export function useCSSVariable(
  variableName: string,
  override?: string,
  cache: boolean = true,
): string | undefined {
  const isSSR = useIsSSR();

  return useMemo(() => {
    if (override !== undefined) return override;
    if (isSSR) return undefined;

    if (cache && cssVariableCache.has(variableName)) {
      return cssVariableCache.get(variableName);
    }

    try {
      const root = document.documentElement;
      const value = getComputedStyle(root).getPropertyValue(variableName).trim() || undefined;

      if (cache) {
        cssVariableCache.set(variableName, value);
      }

      return value;
    } catch {
      // document недоступен — возвращаем undefined, потребитель обязан иметь fallback.
      return undefined;
    }
  }, [variableName, override, isSSR, cache]);
}
