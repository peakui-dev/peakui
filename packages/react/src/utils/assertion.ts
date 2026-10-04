/*
 * Ported from the reference's utils/assertion.ts — only what the components consume. Coerces a
 * condition to a data-attribute value: true — "true", false/undefined — the attribute is absent.
 */
export type Booleanish = boolean | "true" | "false";

export const dataAttr = (condition: boolean | undefined) =>
  (condition ? "true" : undefined) as Booleanish;
