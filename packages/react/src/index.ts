/*
 * Публичная поверхность @peakui/react. tv и cn ре-экспортируются по той же причине, что и в
 * @peakui/styles: расширение tv({extend: buttonVariants}) требует того же инстанса tv, которым
 * собрана библиотека, а не второй копии из своего tailwind-variants.
 */
export {cn, tv, type VariantProps} from "tailwind-variants";
export * from "./components/index.ts";
export * from "./contexts/index.ts";
export * from "./hooks/index.ts";
export * from "./utils/index.ts";
