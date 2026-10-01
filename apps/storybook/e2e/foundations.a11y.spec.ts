import {expect, test} from "@playwright/test";
import {checkA11y, injectAxe} from "axe-playwright";

/*
 * Дымовой тест харнеса, а не компонента: он доказывает, что Storybook поднялся, слой
 * @peakui/styles скомпилировался и переключатель тем доходит до <html> превью.
 *
 * Когда появится packages/react, тесты компонентов лягут рядом как <Name>.spec.ts —
 * этот файл остаётся проверкой основания.
 */

const PREVIEW = "#storybook-preview-iframe";
const TOKENS_STORY = "/?path=/story/foundations-tokens--radii";
const COLORS_STORY = "/?path=/story/foundations-colors--roles";

test.describe("Foundations", () => {
  test("слой стилей скомпилировался: токен доехал до вычисленных стилей", async ({page}) => {
    await page.goto(TOKENS_STORY);

    const frame = page.frameLocator(PREVIEW);
    const heading = frame.getByRole("heading", {level: 2, name: "Радиусы"});

    await expect(heading).toBeVisible();

    // --radius из variables.css: если бы CSS не доехал, значение было бы пустым.
    const radius = await frame
      .locator("html")
      .evaluate((html) => getComputedStyle(html).getPropertyValue("--radius").trim());

    expect(radius).not.toBe("");
  });

  test("переключение темы меняет data-theme на корне превью", async ({page}) => {
    await page.goto(`${COLORS_STORY}&globals=theme:default-dark`);

    const root = page.frameLocator(PREVIEW).locator("html");

    await expect(root).toHaveAttribute("data-theme", "default-dark");

    await page.goto(`${COLORS_STORY}&globals=theme:default-light`);

    await expect(root).toHaveAttribute("data-theme", "default-light");
  });

  test("витрина цветов не нарушает WCAG 2.2 AA", async ({page}) => {
    await page.goto(COLORS_STORY);

    const frame = page.frameLocator(PREVIEW);

    await expect(frame.getByRole("heading", {level: 2, name: "Роли"})).toBeVisible();

    await injectAxe(page);
    await checkA11y(page, PREVIEW, {
      axeOptions: {runOnly: {type: "tag", values: ["wcag2a", "wcag2aa", "wcag22aa"]}},
      detailedReport: true,
    });
  });
});
