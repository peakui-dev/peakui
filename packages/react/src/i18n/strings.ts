/*
 * Default assistive labels, keyed by locale. These are data for useLocalizedStringFormatter, not
 * JSX copy: the component picks the dictionary entry for the active locale (I18nProvider, or the
 * browser's), and a consumer-supplied aria-label still wins over it. A locale with no entry
 * falls back to en-US.
 */
export type StringKey =
  | "close"
  | "pagination"
  | "loading"
  | "clearSearch"
  | "removeTag"
  | "resizeSheet"
  | "heightQuarter"
  | "heightHalf"
  | "heightThreeQuarter"
  | "heightFull"
  | "heightPercent";

/*
 * A string with a placeholder is a function of the variables the component passes to `format`:
 * the formatter substitutes nothing itself.
 */
type StringValue =
  string | ((variables: Record<string, boolean | number | string> | undefined) => string);

export const strings: Record<"en-US" | "ru-RU", Record<StringKey, StringValue>> = {
  "en-US": {
    clearSearch: "Clear search",
    close: "Close",
    heightFull: "Full height",
    heightHalf: "Half height",
    heightPercent: (variables) => `${variables?.["percent"]}% height`,
    heightQuarter: "Quarter height",
    heightThreeQuarter: "Three-quarter height",
    loading: "Loading",
    pagination: "Pagination",
    removeTag: "Remove tag",
    resizeSheet: "Resize sheet",
  },
  "ru-RU": {
    clearSearch: "Очистить поиск",
    close: "Закрыть",
    heightFull: "Полная высота",
    heightHalf: "Половина высоты",
    heightPercent: (variables) => `${variables?.["percent"]}% высоты`,
    heightQuarter: "Четверть высоты",
    heightThreeQuarter: "Три четверти высоты",
    loading: "Загрузка",
    pagination: "Постраничная навигация",
    removeTag: "Удалить тег",
    resizeSheet: "Изменить размер панели",
  },
};
