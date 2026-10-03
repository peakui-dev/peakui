"use client";

import {createContext, use} from "react";

/*
 * Один контекст варианта на всё семейство полей — не по одному на каждый корень поля.
 *
 * Эталон делает наоборот: у TextField, ComboBox и каждого следующего поля свой контекст, а лист
 * читает их все (input.tsx: use(TextFieldContext) и use(ComboBoxContext)). Три причины, по которым
 * здесь иначе, — спека 2026-10-03-input-field-family-design, раздел 1.1. Коротко: так делает сама
 * RAC для той же задачи (один TextContext со слотами по роли, а не контекст на тип корня);
 * цепочка `??` в листе задаёт приоритет, не совпадающий с порядком дерева; и имя
 * TextFieldContext уже занято экспортом react-aria-components.
 *
 * Контракт: КАЖДЫЙ корень поля провайдит этот контекст всегда, в том числе со variant: undefined.
 * Именно это даёт сброс наследования при вложении — иначе вариант внешнего поля протекает внутрь.
 */
export type FieldVariant = "primary" | "secondary";

export interface FieldVariantContextValue {
  variant?: FieldVariant;
}

export const FieldVariantContext = createContext<FieldVariantContextValue>({});

/*
 * Возвращает значение контекста, а не готовый вариант: разрешать свой проп против унаследованного
 * умеет только сама часть — она одна знает, передали ли ей variant.
 */
export function useFieldVariant(): FieldVariantContextValue {
  return use(FieldVariantContext);
}
