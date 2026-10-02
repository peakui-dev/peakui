import {tv as upstreamTv} from "tailwind-variants";
import {describe, expect, it} from "vitest";

import {buttonVariants as fromDeepSubpath} from "@peakui/styles/components/button";

import {buttonVariants, cn, tv, version} from "./index.ts";

describe("@peakui/styles", () => {
  it("экспортирует версию пакета", () => {
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("ре-экспортирует tv и cn как вызываемые функции", () => {
    expect(typeof tv).toBe("function");
    expect(typeof cn).toBe("function");
  });

  /*
   * Не typeof, а тождество: копия tv прошла бы проверку на функцию и всё равно
   * сломала бы потребительский tv({extend: buttonVariants}) при двух установках
   * tailwind-variants в дереве.
   */
  it("ре-экспортирует тот же самый tv, что и tailwind-variants", () => {
    expect(tv).toBe(upstreamTv);
  });

  it("отдаёт вариант-функции компонентов из корня пакета", () => {
    expect(buttonVariants({variant: "primary"})).toContain("button--primary");
  });

  /*
   * «Оба импорта работают одинаково» — не про совпадение вывода, а про тождество объекта:
   * @peakui/styles/components/button и корень обязаны отдавать одну и ту же функцию, иначе
   * tv({extend}) у потребителя расширяет не то, что он стилизует.
   */
  it("отдаёт из подпути тот же самый объект, что из корня", () => {
    expect(fromDeepSubpath).toBe(buttonVariants);
  });
});
