import type {ReactNode} from "react";

import {Children, isValidElement} from "react";

/*
 * Выбирает из children элементы заданного типа и возвращает их отдельным списком, а остальных
 * детей — без них. Порт utils/children.ts эталона; первый потребитель — tag, где собственный
 * Tag.RemoveButton в детях заменяет кнопочный дефолт.
 */
export const pickChildren = <T = ReactNode>(
  children: T | undefined,
  targetChild: React.ElementType,
): [T | undefined, T[] | undefined] => {
  const target: T[] = [];

  const withoutTargetChildren = Children.map(children, (item) => {
    if (!isValidElement(item)) return item;
    if (item.type === targetChild) {
      target.push(item as T);

      return null;
    }

    return item;
  })?.filter(Boolean) as T;

  const targetChildren = target.length > 0 ? target : undefined;

  return [withoutTargetChildren, targetChildren];
};
