/*
 * Публичная JS-поверхность пакета. React здесь нет и не будет: вариант-функции
 * и tv работают в любом фреймворке, что и делает стили framework-agnostic.
 *
 * tv ре-экспортируется, потому что потребительское расширение
 * tv({extend: buttonVariants}) требует того же самого инстанса tv, которым
 * собрана библиотека, а не второй копии из своего tailwind-variants.
 *
 * Утилиты осознанно НЕ экспортируются как JS-строки, в отличие от эталона:
 * они живут в utilities/index.css и берутся через @apply. Причина —
 * docs/superpowers/specs/2026-10-02-composition-contract-design.md, раздел 3.
 */
export {cn, tv, type VariantProps} from "tailwind-variants";
export * from "./components/index.ts";

export const version = "0.0.0";
