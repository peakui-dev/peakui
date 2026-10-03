import {render, screen, setupUser} from "@peakui/testing/helpers";
import {createRef, useCallback, useState} from "react";

import {Button} from "@/components/button/index.ts";
import {InputGroup, InputGroupPrefix, InputGroupRoot} from "@/components/input-group/index.ts";
import {Label} from "@/components/label/index.ts";
import {TextField} from "@/components/textfield/index.ts";
import {FieldVariantContext} from "@/contexts/field-variant.ts";

/*
 * Оболочка группы внутри поля получает role="presentation" — его ставит GroupContext самого RAC
 * TextField. Опознать её по роли нельзя, поэтому здесь единственное место, где запрос идёт по
 * data-slot: он и есть публичный контракт этого элемента.
 */
const shell = () => document.querySelector('[data-slot="input-group"]');

describe("InputGroup", () => {
  let user: ReturnType<typeof setupUser>;

  beforeAll(() => {
    user = setupUser();
  });

  it("renders prefix, control and suffix", () => {
    render(
      <InputGroup>
        <InputGroup.Prefix>@</InputGroup.Prefix>
        <InputGroup.Input aria-label="Handle" />
        <InputGroup.Suffix>.com</InputGroup.Suffix>
      </InputGroup>,
    );

    expect(screen.getByText("@")).toBeInTheDocument();
    expect(screen.getByRole("textbox", {name: "Handle"})).toBeInTheDocument();
    expect(screen.getByText(".com")).toBeInTheDocument();
  });

  it("exposes the BEM block and a data-slot on every part", () => {
    render(
      <InputGroup>
        <InputGroup.Prefix>@</InputGroup.Prefix>
        <InputGroup.Input aria-label="Handle" />
        <InputGroup.Suffix>.com</InputGroup.Suffix>
      </InputGroup>,
    );

    expect(shell()?.className).toEqual(expect.stringContaining("input-group"));
    expect(screen.getByText("@")).toHaveAttribute("data-slot", "input-group-prefix");
    expect(screen.getByRole("textbox")).toHaveAttribute("data-slot", "input-group-input");
    expect(screen.getByText(".com")).toHaveAttribute("data-slot", "input-group-suffix");
  });

  it("focuses the input when the prefix is clicked", async () => {
    render(
      <InputGroup>
        <InputGroup.Prefix>@</InputGroup.Prefix>
        <InputGroup.Input aria-label="Handle" />
      </InputGroup>,
    );

    await user.click(screen.getByText("@"));

    expect(screen.getByRole("textbox", {name: "Handle"})).toHaveFocus();
  });

  it("focuses the textarea when the prefix is clicked", async () => {
    render(
      <InputGroup>
        <InputGroup.Prefix>@</InputGroup.Prefix>
        <InputGroup.TextArea aria-label="Bio" />
      </InputGroup>,
    );

    await user.click(screen.getByText("@"));

    expect(screen.getByRole("textbox", {name: "Bio"})).toHaveFocus();
  });

  it("does not steal a click aimed at a button in the suffix", async () => {
    const onPress = vi.fn();

    render(
      <InputGroup>
        <InputGroup.Input aria-label="Handle" />
        <InputGroup.Suffix>
          <Button aria-label="Clear" onPress={onPress} />
        </InputGroup.Suffix>
      </InputGroup>,
    );

    await user.click(screen.getByRole("button", {name: "Clear"}));

    expect(onPress).toHaveBeenCalledOnce();
    expect(screen.getByRole("textbox", {name: "Handle"})).not.toHaveFocus();
  });

  it("does nothing extra when the click lands on the control itself", async () => {
    const onClick = vi.fn();

    render(
      <InputGroup onClick={onClick}>
        <InputGroup.Input aria-label="Handle" />
      </InputGroup>,
    );

    await user.click(screen.getByRole("textbox", {name: "Handle"}));

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole("textbox", {name: "Handle"})).toHaveFocus();
  });

  it("calls a consumer onClick alongside focusing", async () => {
    const onClick = vi.fn();

    render(
      <InputGroup onClick={onClick}>
        <InputGroup.Prefix>@</InputGroup.Prefix>
        <InputGroup.Input aria-label="Handle" />
      </InputGroup>,
    );

    await user.click(screen.getByText("@"));

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole("textbox", {name: "Handle"})).toHaveFocus();
  });

  it("defaults to the primary variant with no field root above it", () => {
    render(
      <InputGroup>
        <InputGroup.Input aria-label="Handle" />
      </InputGroup>,
    );

    expect(shell()?.className).toEqual(expect.stringContaining("input-group--primary"));
  });

  it("reads the variant from the field context", () => {
    render(
      <FieldVariantContext value={{variant: "secondary"}}>
        <InputGroup>
          <InputGroup.Input aria-label="Handle" />
        </InputGroup>
      </FieldVariantContext>,
    );

    expect(shell()?.className).toEqual(expect.stringContaining("input-group--secondary"));
  });

  it("lets an explicit variant prop win over the context", () => {
    render(
      <FieldVariantContext value={{variant: "secondary"}}>
        <InputGroup variant="primary">
          <InputGroup.Input aria-label="Handle" />
        </InputGroup>
      </FieldVariantContext>,
    );

    expect(shell()?.className).toEqual(expect.stringContaining("input-group--primary"));
  });

  it("applies the full-width modifier", () => {
    render(
      <InputGroup fullWidth>
        <InputGroup.Input aria-label="Handle" />
      </InputGroup>,
    );

    expect(shell()?.className).toEqual(expect.stringContaining("input-group--full-width"));
  });

  it("merges a consumer className on the root and on a slot", () => {
    render(
      <InputGroup className="mine-root">
        <InputGroup.Prefix className="mine-prefix">@</InputGroup.Prefix>
        <InputGroup.Input aria-label="Handle" />
      </InputGroup>,
    );

    expect(shell()?.className).toEqual(expect.stringContaining("input-group"));
    expect(shell()?.className).toEqual(expect.stringContaining("mine-root"));
    expect(screen.getByText("@").className).toEqual(expect.stringContaining("input-group__prefix"));
    expect(screen.getByText("@").className).toEqual(expect.stringContaining("mine-prefix"));
  });

  it("marks the group invalid from the field it sits in", () => {
    render(
      <TextField isInvalid>
        <Label>Handle</Label>
        <InputGroup>
          <InputGroup.Input />
        </InputGroup>
      </TextField>,
    );

    expect(shell()).toHaveAttribute("data-invalid");
  });

  /*
   * Найдено ревью ветки. Контрол группы опознаётся по data-slot, а не как «первый input в
   * поддереве»: интерактивный контрол в префиксе — select-all чекбокс, переключатель — попадал под
   * querySelector("input") раньше собственного контрола группы.
   */
  it("focuses the group's own control, not an input living in the prefix", async () => {
    render(
      <InputGroup>
        <InputGroup.Prefix>
          <span>все</span>
          <input aria-label="Выбрать все" type="checkbox" />
        </InputGroup.Prefix>
        <InputGroup.Input aria-label="Запрос" />
      </InputGroup>,
    );

    await user.click(screen.getByText("все"));

    expect(screen.getByRole("textbox", {name: "Запрос"})).toHaveFocus();
    expect(screen.getByRole("checkbox", {name: "Выбрать все"})).not.toHaveFocus();
  });

  /* Найдено ревью: охрана перечисляла теги и две роли, а интерактивность бывает и ролью. */
  it("does not steal a click aimed at a role=link in the suffix", async () => {
    render(
      <InputGroup>
        <InputGroup.Input aria-label="Запрос" />
        <InputGroup.Suffix>
          <span role="link" tabIndex={0}>
            справка
          </span>
        </InputGroup.Suffix>
      </InputGroup>,
    );

    await user.click(screen.getByText("справка"));

    expect(screen.getByRole("textbox", {name: "Запрос"})).not.toHaveFocus();
  });

  /* Найдено ревью: переключатель RAC — это <label> вокруг скрытого input, и клик приходит по span. */
  it("does not steal a click aimed at a label-wrapped control in the suffix", async () => {
    render(
      <InputGroup>
        <InputGroup.Input aria-label="Запрос" />
        <InputGroup.Suffix>
          <label>
            <input aria-label="Показать" className="sr-only" type="checkbox" />
            <span>глаз</span>
          </label>
        </InputGroup.Suffix>
      </InputGroup>,
    );

    await user.click(screen.getByText("глаз"));

    expect(screen.getByRole("textbox", {name: "Запрос"})).not.toHaveFocus();
  });

  /*
   * Найдено ревью: собранный руками в JSX ref отцеплялся и прицеплялся заново на каждый рендер —
   * у контролируемого поля это один цикл на нажатие клавиши, то есть снос и пересборка любого
   * побочного эффекта в ref-колбэке.
   */
  it("attaches a stable ref callback once across re-renders", async () => {
    const calls: string[] = [];

    const Probe = () => {
      const [count, setCount] = useState(0);
      const refCallback = useCallback((node: HTMLDivElement | null) => {
        calls.push(node ? "node" : "null");
      }, []);

      return (
        <>
          <button type="button" onClick={() => setCount((n) => n + 1)}>
            рендер {count}
          </button>
          <InputGroup ref={refCallback}>
            <InputGroup.Input aria-label="Запрос" />
          </InputGroup>
        </>
      );
    };

    render(<Probe />);
    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("button"));

    expect(calls).toEqual(["node"]);
  });

  it("forwards ref to the group element", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <InputGroup ref={ref}>
        <InputGroup.Input aria-label="Handle" />
      </InputGroup>,
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("behaves identically as InputGroup.Prefix and InputGroupPrefix", () => {
    render(
      <>
        <InputGroupRoot>
          <InputGroup.Prefix>namespaced</InputGroup.Prefix>
          <InputGroup.Input aria-label="One" />
        </InputGroupRoot>
        <InputGroupRoot>
          <InputGroupPrefix>flat</InputGroupPrefix>
          <InputGroup.Input aria-label="Two" />
        </InputGroupRoot>
      </>,
    );

    for (const text of ["namespaced", "flat"]) {
      expect(screen.getByText(text)).toHaveAttribute("data-slot", "input-group-prefix");
    }
  });
});
