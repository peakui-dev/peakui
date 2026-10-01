import {defineConfig, devices} from "@playwright/test";

const PORT = Number(process.env.STORYBOOK_PORT ?? 6007);
const BASE_URL = `http://127.0.0.1:${PORT}`;

/*
 * Конфиг живёт в приложении, а не в корне: Storybook — его зависимость, и порт знает оно.
 * test:e2e поднимает dev-сервер, test:e2e:ci сначала собирает статику (см. package.json).
 */
export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  projects: [
    {
      name: "chromium",
      use: {...devices["Desktop Chrome"]},
    },
  ],
  reporter: process.env.CI ? "html" : "list",
  retries: process.env.CI ? 2 : 0,
  testDir: "./e2e",
  use: {
    baseURL: BASE_URL,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  webServer: {
    command: process.env.CI
      ? `pnpm exec http-server storybook-static --port ${PORT} --silent`
      : "pnpm dev",
    reuseExistingServer: !process.env.CI,
    url: BASE_URL,
  },
  workers: process.env.CI ? 1 : undefined,
});
