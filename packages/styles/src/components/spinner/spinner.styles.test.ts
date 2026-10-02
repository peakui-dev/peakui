import {describe, expect, it} from "vitest";

import {spinnerVariants} from "./spinner.styles.ts";

describe("spinnerVariants", () => {
  it("отдаёт дефолты при вызове без аргументов", () => {
    const result = spinnerVariants();

    expect(result).toContain("spinner");
    expect(result).toContain("spinner--accent");
    expect(result).toContain("spinner--md");
  });

  it.each([
    ["current", "spinner--current"],
    ["accent", "spinner--accent"],
    ["danger", "spinner--danger"],
    ["success", "spinner--success"],
    ["warning", "spinner--warning"],
  ] as const)("отображает color %s в %s", (color, expected) => {
    expect(spinnerVariants({color})).toContain(expected);
  });

  it.each([
    ["sm", "spinner--sm"],
    ["md", "spinner--md"],
    ["lg", "spinner--lg"],
    ["xl", "spinner--xl"],
  ] as const)("отображает size %s в %s", (size, expected) => {
    expect(spinnerVariants({size})).toContain(expected);
  });

  it("не emit-ит ни одной утилиты Tailwind", () => {
    const result = spinnerVariants({color: "danger", size: "xl"});

    for (const token of result.split(" ")) {
      expect(token).toMatch(/^spinner(--[a-z-]+)?$/);
    }
  });

  it("переживает неизвестное значение варианта из нетипизированного JS", () => {
    expect(spinnerVariants({size: "nope"} as never)).toContain("spinner");
  });
});
