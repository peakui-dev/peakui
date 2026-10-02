import type {Preview} from "@storybook/react-vite";

import {THEME_GLOBAL_ID, themeGlobalType, withTheme} from "./decorators/theme";

import "./globals.css";

/*
 * `export default` — требование CSF и Storybook, а не отступление от правила «только именованные
 * экспорты»: конфиг читается загрузчиком по default-экспорту.
 */
const preview: Preview = {
  decorators: [withTheme],
  globalTypes: themeGlobalType,
  initialGlobals: {
    [THEME_GLOBAL_ID]: "default-light",
  },
  parameters: {
    a11y: {
      /*
       * Пол доступности WCAG 2.2 AA держит Playwright в e2e/: checkA11y роняет сборку на любом
       * нарушении, и это гейт записи. Здесь — "off", потому что этот параметр настраивает
       * собственный тест-раннер Storybook, который в репозитории не установлен, зато заставляет
       * addon-a11y прогонять axe в превью. Два прогона axe на одной странице гонятся друг с
       * другом: наш injectAxe падает с «Axe is already running» на случайной истории. Дефект
       * был латентным и проявился, когда набор вырос с 10 тестов до 16.
       */
      test: "off",
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    layout: "fullscreen",
    options: {
      storySort: {
        method: "alphabetical",
        order: ["Foundations", "Components"],
      },
    },
  },
};

export default preview;
