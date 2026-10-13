import {expect, test} from "@playwright/test";

/*
 * Браузерный ярус ProgressBar: раскладка сетки корня. jsdom не считает геометрию, а ошибка здесь
 * геометрическая: пустая строка «подпись / вывод» сетки всё равно даёт row-gap, и дорожка полосы
 * без подписи и без вывода сидит ниже верха компонента.
 *
 * Идём по прямому адресу iframe.html: страница и есть документ превью.
 */

const STORY = {
  default: "components-progressbar--default",
  withoutLabel: "components-progressbar--without-label",
} as const;

/* Холодный dev-сервер компилирует превью по первому запросу дольше окна expect из конфигурации. */
const GEOMETRY_TIMEOUT = {timeout: 60_000} as const;

/*
 * Верхи корня и дорожки. Корень — роль progressbar; у дорожки нет ни роли, ни имени, поэтому
 * её находит data-slot (testing.md: data-slot, когда роль, подпись и текст не годятся).
 */
const tops = (root: Element) => {
  const track = root.querySelector('[data-slot="progress-bar-track"]');

  if (!track) throw new Error("в полосе нет дорожки");

  return {root: root.getBoundingClientRect().top, track: track.getBoundingClientRect().top};
};

test.describe("ProgressBar (браузер)", () => {
  /* Первый тест воркера платит за холодную компиляцию превью dev-сервером целиком. */
  test.setTimeout(150_000);

  test("без подписи и вывода дорожка стоит у верха компонента", async ({page}) => {
    await page.goto(`/iframe.html?id=${STORY.withoutLabel}`);

    const bar = page.getByRole("progressbar", {name: "Loading progress"});

    await expect(bar).toBeVisible(GEOMETRY_TIMEOUT);

    const {root, track} = await bar.evaluate(tops);

    expect(track).toBe(root);
  });

  test("с подписью дорожка стоит ниже верха компонента", async ({page}) => {
    await page.goto(`/iframe.html?id=${STORY.default}`);

    const bar = page.getByRole("progressbar", {name: "Loading"});

    await expect(bar).toBeVisible(GEOMETRY_TIMEOUT);

    const {root, track} = await bar.evaluate(tops);

    expect(track).toBeGreaterThan(root);
  });
});
