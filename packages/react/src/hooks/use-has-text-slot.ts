"use client";

import {createContext, use} from "react";
import {TextContext} from "react-aria-components/Text";

/*
 * Корни-коллекции RAC (TagGroup и подобные) отдают детей CollectionBuilder, и тот монтирует скрытое
 * дерево ДО того, как появятся слоты TextContext. Такой корень оборачивают в FieldSlotsGateContext,
 * и тогда Description с FieldError ждут видимого прохода вместо того, чтобы отрендериться в скрытом.
 *
 * Вне гейта хук всегда true — это обычный случай: TextField, самостоятельный Description и прочее.
 */
export const FieldSlotsGateContext = createContext(false);

/** Доступен ли слот TextContext.slots[slot] для рендера. */
export function useHasTextSlot(slot: string): boolean {
  const gated = use(FieldSlotsGateContext);
  const textContext = use(TextContext);

  if (!gated) {
    return true;
  }

  /*
   * Сужение, а не приведение типа: ContextValue у RAC — объединение, в котором slots есть только у
   * слотированной ветки. Эталон в этом месте пишет as {slots?: …}; здесь обходимся без него.
   */
  const slots =
    textContext !== null && typeof textContext === "object" && "slots" in textContext
      ? textContext.slots
      : undefined;

  return slots?.[slot] != null;
}
