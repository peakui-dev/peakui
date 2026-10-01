import {defineConfig, devices} from "@playwright/test";

const PORT = Number(process.env.STORYBOOK_PORT ?? 6007);
const BASE_URL = `http://127.0.0.1:${PORT}`;

/*
 * Конфиг живёт в приложении, а не в корне: Storybook — его зависимость, и порт знает оно.
 * test:e2e поднимает dev-сервер, test:e2e:ci сначала собирает статику (см. package.json).
 */
export default defineConfig({
  /*
   * Холодный dev-сервер компилирует бандл превью по первому запросу, и пять секунд по умолчанию
   * истекают раньше, чем история отрендерится: iframe пуст, data-theme отсутствует.
   */
  expect: {timeout: 20_000},
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
    /*
     * Порт подставляется здесь, а не в скрипте dev: pnpm не раскрывает ${VAR} в теле скрипта
     * и передаёт строку в Storybook буквально. Поэтому webServer запускает storybook напрямую.
     */
    command: process.env.CI
      ? `pnpm exec http-server storybook-static --port ${PORT} --silent`
      : `pnpm exec storybook dev --host 127.0.0.1 --port ${PORT} --no-open --quiet`,
    /*
     * Никогда не переиспользуем чужой сервер. Порт 6007 может держать другой проект, и тогда
     * reuseExistingServer принял бы его Storybook за наш: тесты шли бы против постороннего
     * приложения и падали бы без намёка на причину. Лучше явная ошибка «порт занят».
     */
    reuseExistingServer: false,
    /*
     * Ждём индекс историй, а не корень: dev-сервер отвечает по HTTP раньше, чем соберёт
     * index.json, и тест, ушедший в манагер до этого, не находит историю вообще.
     */
    url: `${BASE_URL}/index.json`,
  },
  workers: process.env.CI ? 1 : undefined,
});
