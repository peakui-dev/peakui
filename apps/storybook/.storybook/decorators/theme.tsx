import type {Decorator} from "@storybook/react-vite";

import {useEffect} from "react";

/** Темы, которые реально генерирует @peakui/styles (см. packages/styles/presets). */
export const THEMES = ["default-light", "default-dark"] as const;

export const THEME_GLOBAL_ID = "theme";

const DEFAULT_THEME = THEMES[0];

export const themeGlobalType = {
  [THEME_GLOBAL_ID]: {
    name: "Тема",
    description: "Тема PeakUI",
    defaultValue: DEFAULT_THEME,
    toolbar: {
      icon: "paintbrush",
      items: [
        {value: "default-light", title: "default-light"},
        {value: "default-dark", title: "default-dark"},
      ],
      showName: true,
      dynamicTitle: true,
    },
  },
};

/*
 * Тема применяется к <html> превью, а не к обёртке истории: селекторы темы в variables.css
 * объявлены на :root/[data-theme], поэтому обёртка их не активирует.
 */
export const withTheme: Decorator = (Story, context) => {
  const theme = String(context.globals[THEME_GLOBAL_ID] ?? DEFAULT_THEME);

  useEffect(() => {
    const root = document.documentElement;

    root.setAttribute("data-theme", theme);
    root.classList.remove(...THEMES);
    root.classList.add(theme);
  }, [theme]);

  return <Story />;
};
