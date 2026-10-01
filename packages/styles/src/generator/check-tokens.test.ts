import {describe, expect, it} from "vitest";

import {checkTokens} from "./check-tokens.ts";

describe("checkTokens", () => {
  it("на чистом дереве ошибок нет", () => {
    expect(checkTokens().errors).toEqual([]);
  });

  it("ловит дрейф между пресетом и закоммиченным CSS", () => {
    expect(
      checkTokens({committed: {"themes/default/variables.css": "/* stale */"}}).errors,
    ).toContainEqual(expect.stringMatching(/дрейф/i));
  });

  it("ловит висящий токен из theme.css", () => {
    expect(
      checkTokens({themeCss: "@theme inline { --color-x: var(--nope); }"}).errors,
    ).toContainEqual(expect.stringMatching(/--nope/));
  });

  it("ловит неполную тему", () => {
    expect(
      checkTokens({extraTheme: {id: "partial", tokens: {background: "oklch(1 0 0)"}}}).errors,
    ).toContainEqual(expect.stringMatching(/partial/));
  });

  it("ловит литеральный цвет в components/*.css", () => {
    expect(
      checkTokens({componentCss: {"chip.css": ".chip { color: #fff; }"}}).errors,
    ).toContainEqual(expect.stringMatching(/chip\.css/));
  });

  it("ловит ссылку на необъявленный токен в CSS компонента", () => {
    // Это буквальный пример из Review Focus #5 плана, и он проходил все гейты.
    const errors = checkTokens({
      componentCss: {
        "card.css": ".card { color: var(--color-muted-foreground); background: var(--color-nope); }",
      },
    }).errors;

    expect(errors).toContainEqual(expect.stringMatching(/--color-muted-foreground/));
    expect(errors).toContainEqual(expect.stringMatching(/--color-nope/));
  });

  it("не ругается на объявленный токен в CSS компонента", () => {
    expect(
      checkTokens({componentCss: {"card.css": ".card { color: var(--color-muted); }"}}).errors,
    ).toEqual([]);
  });

  it("ловит var() внутри color-mix, а не только сразу после двоеточия", () => {
    expect(
      checkTokens({
        componentCss: {"c.css": ".c { color: color-mix(in oklab, var(--color-ghost), transparent); }"},
      }).errors,
    ).toContainEqual(expect.stringMatching(/--color-ghost/));
  });

  it("ловит числовой токен в components/*.css", () => {
    expect(
      checkTokens({componentCss: {"chip.css": ".chip { color: var(--color-accent-9); }"}}).errors,
    ).toContainEqual(expect.stringMatching(/accent-9/));
  });
});
