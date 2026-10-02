import {describe, expect, it} from "vitest";

import {buttonVariants} from "./button.styles.ts";

describe("buttonVariants", () => {
  it("отдаёт дефолты при вызове без аргументов", () => {
    const result = buttonVariants();

    expect(result).toContain("button");
    expect(result).toContain("button--md");
    expect(result).toContain("button--primary");
  });

  it.each([
    ["primary", "button--primary"],
    ["secondary", "button--secondary"],
    ["tertiary", "button--tertiary"],
    ["danger", "button--danger"],
    ["danger-soft", "button--danger-soft"],
    ["ghost", "button--ghost"],
    ["outline", "button--outline"],
  ] as const)("отображает variant %s в %s", (variant, expected) => {
    expect(buttonVariants({variant})).toContain(expected);
  });

  it.each([
    ["sm", "button--sm"],
    ["md", "button--md"],
    ["lg", "button--lg"],
  ] as const)("отображает size %s в %s", (size, expected) => {
    expect(buttonVariants({size})).toContain(expected);
  });

  it("отображает булевы варианты", () => {
    expect(buttonVariants({isIconOnly: true})).toContain("button--icon-only");
    expect(buttonVariants({fullWidth: true})).toContain("button--full-width");
  });

  it("не emit-ит ни одной утилиты Tailwind", () => {
    const result = buttonVariants({size: "lg", variant: "ghost"});

    for (const token of result.split(" ")) {
      expect(token).toMatch(/^button(--[a-z-]+)?$/);
    }
  });

  it("переживает неизвестное значение варианта из нетипизированного JS", () => {
    const result = buttonVariants({variant: "nope"} as never);

    expect(result).toContain("button");
  });
});
