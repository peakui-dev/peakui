/*
 * Портировано из utils/assertion.ts эталона — только то, что потребляют компоненты. Приведение
 * условий к значениям data-атрибутов: true — «true», false/undefined — атрибут отсутствует.
 */
export type Booleanish = boolean | "true" | "false";

export const dataAttr = (condition: boolean | undefined) =>
  (condition ? "true" : undefined) as Booleanish;
