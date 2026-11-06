/*
 * Default assistive labels, keyed by locale. These are data for useLocalizedStringFormatter, not
 * JSX copy: the component picks the dictionary entry for the active locale (I18nProvider, or the
 * browser's), and a consumer-supplied aria-label still wins over it. A locale with no entry
 * falls back to en-US.
 */
export type StringKey = "close" | "pagination" | "loading" | "clearSearch" | "removeTag";

export const strings: Record<"en-US" | "ru-RU", Record<StringKey, string>> = {
  "en-US": {
    clearSearch: "Clear search",
    close: "Close",
    loading: "Loading",
    pagination: "Pagination",
    removeTag: "Remove tag",
  },
  "ru-RU": {
    clearSearch: "Очистить поиск",
    close: "Закрыть",
    loading: "Загрузка",
    pagination: "Постраничная навигация",
    removeTag: "Удалить тег",
  },
};
