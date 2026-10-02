import {composeSlotClassName, composeTwRenderProps} from "@/utils/compose";

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

/*
 * composeSlotClassName существует потому, что SKILL.md:110 называет его частью фундамента («если
 * его ещё нет, создать — первая задача, а не импровизация внутри компонента»), SKILL.md:206
 * требует композировать слоты только им, и он стоит в рабочих примерах architecture.md,
 * styling.md и typescript.md. Пять мест в стандарте инструктировали импортировать несуществующий
 * символ.
 *
 * Ни Button, ни Spinner слотов не имеют, поэтому первым потребителем будет многослотовый
 * компонент — но стандарт обещает функцию уже сейчас.
 *
 * Подпись эталона типизирована через any; здесь unknown: это не граница полиморфного spread'а, и
 * исключение на неё не распространяется.
 */
describe("composeSlotClassName", () => {
  it("returns the consumer className unchanged when there is no slot function", () => {
    expect(composeSlotClassName(undefined, "mt-4")).toBe("mt-4");
  });

  it("returns undefined when there is neither a slot function nor a className", () => {
    expect(composeSlotClassName(undefined)).toBeUndefined();
  });

  it("passes the className into the slot function", () => {
    const slot = (args?: {className?: string}) => `select__trigger ${args?.className ?? ""}`.trim();

    expect(composeSlotClassName(slot, "mt-4")).toBe("select__trigger mt-4");
  });

  it("passes variants into the slot function alongside the className", () => {
    const slot = (args?: Record<string, unknown> & {className?: string}) =>
      `chip--${String(args?.size)} ${args?.className ?? ""}`.trim();

    expect(composeSlotClassName(slot, "mt-4", {size: "lg"})).toBe("chip--lg mt-4");
  });

  it("lets the slot function run with no className at all", () => {
    const slot = (args?: {className?: string}) => `spinner ${args?.className ?? ""}`.trim();

    expect(composeSlotClassName(slot)).toBe("spinner");
  });
});
