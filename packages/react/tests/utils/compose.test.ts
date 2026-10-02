import {composeTwRenderProps} from "@/utils/compose";

/*
 * Первые два случая — пункты 1 и 2 Review Focus плана: потребительский className обязан
 * слиться с BEM-именами, а не заменить их, и className в виде функции обязан работать,
 * потому что именно эту форму потребитель списывает из документации RAC.
 */

const resolve = <T>(composed: string | ((v: T) => string), renderProps: T): string =>
  typeof composed === "function" ? composed(renderProps) : composed;

describe("composeTwRenderProps", () => {
  it("merges a consumer string className with the library classes", () => {
    const result = resolve(composeTwRenderProps("mt-4", "button button--primary"), {});

    expect(result).toEqual(expect.stringContaining("button button--primary"));
    expect(result).toEqual(expect.stringContaining("mt-4"));
  });

  it("accepts a function className and passes render props to it", () => {
    const composed = composeTwRenderProps(
      ({isPressed}: {isPressed: boolean}) => (isPressed ? "pressed" : "idle"),
      "button",
    );
    const result = resolve(composed, {isPressed: true});

    expect(result).toEqual(expect.stringContaining("button"));
    expect(result).toEqual(expect.stringContaining("pressed"));
    expect(result).not.toEqual(expect.stringContaining("[object Object]"));
  });

  it("returns the library classes unchanged when no className is given", () => {
    const result = resolve(composeTwRenderProps(undefined, "button button--md"), {});

    expect(result).toEqual(expect.stringContaining("button button--md"));
  });

  it("accepts a function for the library classes", () => {
    const result = resolve(
      composeTwRenderProps(undefined, () => "button button--lg"),
      {},
    );

    expect(result).toEqual(expect.stringContaining("button--lg"));
  });
});
