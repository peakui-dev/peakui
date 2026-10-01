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
      // Находки a11y — ошибка сборки, а не предупреждение: пол доступности WCAG 2.2 AA.
      test: "error",
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
