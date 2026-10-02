"use client";

import type {AllHTMLAttributes, JSX, ReactElement, Ref} from "react";

import {mergeRefs, useLayoutEffect} from "@react-aria/utils";
import {useMemo, useRef} from "react";

/*
 * Портировано из внутреннего utils.tsx библиотеки react-aria-components:
 * https://github.com/adobe/react-spectrum/blob/0e69a1b/packages/react-aria-components/src/utils.tsx
 * Удалить и импортировать напрямую, когда RAC начнёт это экспортировать. Эталон держит ту же копию
 * с той же причиной.
 *
 * Нужен компонентам, которые рендерят обычный DOM-элемент, а не примитив RAC: полиморфизм там не
 * приходит бесплатно, а SKILL.md требует его через render-проп, не через as.
 */

export type DOMRenderFunction<E extends keyof JSX.IntrinsicElements, T> = (
  props: JSX.IntrinsicElements[E],
  renderProps: T,
) => ReactElement;

export interface DOMRenderProps<E extends keyof JSX.IntrinsicElements, T> {
  /**
   * Заменяет элемент по умолчанию своей функцией рендера — так к компоненту подключают
   * роутерные ссылки, анимационные обёртки и уже стилизованные элементы.
   *
   * Требования:
   *
   * - вернуть элемент ожидаемого типа (ждут `<button>` — нельзя вернуть `<a>`);
   * - вернуть один корневой DOM-элемент, не фрагмент;
   * - пробросить props и ref на этот элемент, слив со своими.
   */
  render?: DOMRenderFunction<E, T>;
}

/*
 * Единственное место в пакете, где разрешён any, и оба вхождения ниже — он: тип элемента здесь
 * параметр, который spread уже стёр, и выразимой аннотации для него не существует. Условия
 * исключения — references/typescript.md, раздел о границе полиморфного spread'а.
 */
/*
 * Файл — модуль утилит, а не модуль компонента: fast refresh к нему неприменим, и правило
 * здесь ловит форму, а не дефект. Эталон отключает его в этом же месте.
 */
// eslint-disable-next-line react-refresh/only-export-components
function DOMElement(
  ElementType: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: DOMRenderProps<any, any> & AllHTMLAttributes<HTMLElement> & {ref?: Ref<HTMLElement>},
) {
  const {ref: forwardedRef, render, ...otherProps} = props;
  const elementRef = useRef<HTMLElement | null>(null);
  const ref = useMemo(() => mergeRefs(forwardedRef, elementRef), [forwardedRef]);

  useLayoutEffect(() => {
    if (typeof process !== "undefined" && process.env["NODE_ENV"] !== "production" && render) {
      if (!elementRef.current) {
        // eslint-disable-next-line no-console
        console.warn(
          "Ref не доехал до DOM-элемента, который вернула функция render. Пробросили ли вы ref дальше?",
        );
      }
    }
  }, [ElementType, render]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const domProps: any = {...otherProps, ref};

  if (render) {
    return render(domProps, undefined);
  }

  return <ElementType {...domProps} />;
}

type DOMComponents = {
  [E in keyof JSX.IntrinsicElements]: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: DOMRenderProps<E, any> & JSX.IntrinsicElements[E],
  ) => ReactElement;
};

const domComponentCache: Record<string, unknown> = {};

/** Компонент на каждый интринсик-элемент, собирается по требованию и кешируется: `dom.span`. */
export const dom = new Proxy(
  {},
  {
    get(_target, elementType) {
      if (typeof elementType !== "string") {
        return undefined;
      }

      let cached = domComponentCache[elementType];

      if (!cached) {
        cached = DOMElement.bind(null, elementType);
        domComponentCache[elementType] = cached;
      }

      return cached;
    },
  },
) as DOMComponents;
