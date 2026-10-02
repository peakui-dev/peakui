import {readFileSync} from "node:fs";

import {describe, expect, it} from "vitest";

/*
 * Контентный гейт в той же форме, что гейт полноты бочки: пакет работает в окружении node и
 * вычислить стиль не может. Поведенческое доказательство — утверждение в
 * apps/storybook/e2e/Button.spec.ts, которое читает computed pointer-events у pending-кнопки.
 * Этот тест его не заменяет, а ловит удаление правила.
 */

const utilities = readFileSync("utilities/index.css", "utf8");
const buttonCss = readFileSync("components/button.css", "utf8");

describe("состояние pending", () => {
  it("объявляет утилиту status-pending", () => {
    expect(utilities).toMatch(/@utility status-pending \{/);
  });

  it("применяет её из состояния data-pending у кнопки", () => {
    expect(buttonCss).toMatch(/&\[data-pending="true"\]\s*\{[^}]*@apply status-pending;/);
  });
});
