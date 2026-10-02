import {expect, test} from "@playwright/test";
import {checkA11y, injectAxe} from "axe-playwright";

/*
 * Button существует пока только как стилевой слой: packages/react не создан, React-компонента нет.
 * Поэтому этот файл проверяет два контракта стилевого слоя, а не поведение компонента.
 *
 * Аудит идёт по прямому адресу iframe. Через манагер с селектором фрейма — checkA11y(page,
 * "#storybook-preview-iframe") — проверялся бы сам элемент iframe, а не история внутри него:
 * injectAxe доходит только до главного фрейма. Эта ошибка здесь однажды уже прошла и спрятала
 * настоящий дефект контраста, см. ../AGENTS.md.
 */

const STORIES = [
  "components-button--without-react",
  "components-button--variant-function-parity",
] as const;
const THEMES = ["default-light", "default-dark"] as const;

test.describe("Button — стилевой слой", () => {
  /*
   * Обещание Framework-Agnostic Styles как тест, а не как стори: голая разметка без единого
   * React-компонента PeakUI обязана получить настоящий фон, высоту и радиус. Если бы CSS не доехал
   * или имя класса разъехалось с правилом, фон остался бы прозрачным — молча, без ошибки.
   */
  test("голая разметка стилизуется без React", async ({page}) => {
    await page.goto(`/iframe.html?id=${STORIES[0]}&globals=theme:default-light`);

    const link = page.locator("a.button--secondary");

    await expect(link).toBeVisible();

    const computed = await link.evaluate((el) => {
      const style = getComputedStyle(el);

      return {
        background: style.backgroundColor,
        decoration: style.textDecorationLine,
        height: Number.parseFloat(style.height),
        radius: Number.parseFloat(style.borderTopLeftRadius),
      };
    });

    expect(computed.background).not.toBe("rgba(0, 0, 0, 0)");
    expect(computed.radius).toBeGreaterThan(0);
    expect(computed.decoration).toBe("none");
    // Пол WCAG 2.2 для цели указателя — 24px; базовая высота рассчитана с запасом.
    expect(computed.height).toBeGreaterThanOrEqual(24);
  });

  for (const theme of THEMES) {
    for (const id of STORIES) {
      test(`${id} не нарушает WCAG 2.2 AA в теме ${theme}`, async ({page}) => {
        await page.goto(`/iframe.html?id=${id}&globals=theme:${theme}`);

        await expect(page.getByRole("heading", {level: 2})).toBeVisible();

        await injectAxe(page);
        await checkA11y(page, undefined, {
          axeOptions: {runOnly: {type: "tag", values: ["wcag2a", "wcag2aa", "wcag22aa"]}},
          detailedReport: true,
        });
      });
    }
  }
});
