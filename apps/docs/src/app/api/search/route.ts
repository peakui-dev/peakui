import {createI18nSearchAPI} from "fumadocs-core/search/server";

import {i18n} from "@/lib/i18n";
import {source} from "@/lib/source";

export const {GET} = createI18nSearchAPI("advanced", {
  i18n,
  indexes: source.getLanguages().flatMap(({language, pages}) =>
    pages.map((page) => ({
      description: page.data.description,
      id: page.url,
      locale: language,
      structuredData: page.data.structuredData,
      title: page.data.title,
      url: page.url,
    })),
  ),
  localeMap: {
    en: "english",
  },
});
