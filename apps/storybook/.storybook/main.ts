import type {StorybookConfig} from "@storybook/react-vite";

/*
 * Глобы относительны этому каталогу. Путь в packages/react намеренно указан до появления пакета:
 * истории компонентов попадают в Storybook без правки конфига.
 */
const config: StorybookConfig = {
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
    enableCrashReports: false,
  },
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  stories: [
    "../src/stories/**/*.stories.@(ts|tsx)",
    "../../../packages/react/src/**/*.stories.@(ts|tsx)",
  ],
};

export default config;
