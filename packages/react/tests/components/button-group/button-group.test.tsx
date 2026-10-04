import {render, screen, setupUser} from "@peakui/testing/helpers";
import {createRef} from "react";
import {ToggleButtonGroupContext as RACToggleButtonGroupContext} from "react-aria-components/ToggleButtonGroup";

import {Button} from "@/components/button/index.ts";
import {
  ButtonGroup,
  ButtonGroupRoot,
  ButtonGroupSeparator,
} from "@/components/button-group/index.ts";

/* Оболочка — role="group" от RAC Group; опознаётся по роли, а не по data-slot. */
const group = () => screen.getByRole("group");

describe("ButtonGroup", () => {
  let user: ReturnType<typeof setupUser>;

  beforeAll(() => {
    user = setupUser();
  });

  it("рендерит группу с ролями и именами дочерних кнопок", () => {
    render(
      <ButtonGroup>
        <Button>Первый</Button>
        <Button>Вторый</Button>
      </ButtonGroup>,
    );

    expect(group()).toBeInTheDocument();
    expect(screen.getByRole("button", {name: "Первый"})).toBeInTheDocument();
    expect(screen.getByRole("button", {name: "Вторый"})).toBeInTheDocument();
  });

  it("выставляет BEM-блок и data-slot на оболочке", () => {
    render(
      <ButtonGroup>
        <Button>Первый</Button>
      </ButtonGroup>,
    );

    expect(group().className).toEqual(expect.stringContaining("button-group"));
    expect(group()).toHaveAttribute("data-slot", "button-group");
  });

  it("ведёт себя одинаково как ButtonGroup.Root и ButtonGroupRoot", () => {
    render(
      <>
        <ButtonGroup.Root>
          <Button>Из пространства имён</Button>
        </ButtonGroup.Root>
        <ButtonGroupRoot>
          <Button>Плоское имя</Button>
        </ButtonGroupRoot>
      </>,
    );

    const groups = document.querySelectorAll('[data-slot="button-group"]');

    expect(groups).toHaveLength(2);

    for (const element of groups) {
      expect(element).toHaveAttribute("role", "group");
    }

    expect(screen.getByRole("button", {name: "Из пространства имён"})).toBeInTheDocument();
    expect(screen.getByRole("button", {name: "Плоское имя"})).toBeInTheDocument();
  });

  it("горизонтальная ориентация по умолчанию", () => {
    render(
      <ButtonGroup>
        <Button>Первый</Button>
      </ButtonGroup>,
    );

    expect(group().className).toEqual(expect.stringContaining("button-group--horizontal"));
  });

  it("вертикальная ориентация выставляет модификатор", () => {
    render(
      <ButtonGroup orientation="vertical">
        <Button>Первый</Button>
      </ButtonGroup>,
    );

    expect(group().className).toEqual(expect.stringContaining("button-group--vertical"));
  });

  it("наследует ориентацию от объемлющего провайдера контекста ToggleButtonGroup", () => {
    /*
     * Контекст RACToggleButtonGroup провайдит не сам RAC ToggleButtonGroup, а родитель вроде
     * Toolbar из эталона — поэтому тест ставит провайдер так же, как ставит его такой родитель.
     */
    render(
      <RACToggleButtonGroupContext.Provider value={{orientation: "vertical"}}>
        <ButtonGroup>
          <Button>Первый</Button>
        </ButtonGroup>
      </RACToggleButtonGroupContext.Provider>,
    );

    expect(group().className).toEqual(expect.stringContaining("button-group--vertical"));
  });

  it("fullWidth выставляет модификатор", () => {
    render(
      <ButtonGroup fullWidth>
        <Button>Первый</Button>
      </ButtonGroup>,
    );

    expect(group().className).toEqual(expect.stringContaining("button-group--full-width"));
  });

  it("сливает className потребителя с BEM-именами", () => {
    render(
      <ButtonGroup className="mt-4">
        <Button>Первый</Button>
      </ButtonGroup>,
    );

    expect(group().className).toEqual(expect.stringContaining("button-group"));
    expect(group().className).toEqual(expect.stringContaining("mt-4"));
  });

  it("передаёт ref на элемент группы", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <ButtonGroup ref={ref}>
        <Button>Первый</Button>
      </ButtonGroup>,
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toBe(group());
  });

  it("разделитель скрыт от дерева доступности и несёт свой data-slot", () => {
    render(
      <ButtonGroup>
        <Button>Первый</Button>
        <Button>
          <ButtonGroup.Separator />
          Вторый
        </Button>
      </ButtonGroup>,
    );

    const separator = document.querySelector('[data-slot="button-group-separator"]');

    expect(separator).not.toBeNull();
    expect(separator).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("button", {name: "Вторый"})).toBeInTheDocument();
  });

  it("разделитель доступен и плоским именем ButtonGroupSeparator", () => {
    render(
      <ButtonGroup>
        <Button>Первый</Button>
        <Button>
          <ButtonGroupSeparator />
          Вторый
        </Button>
      </ButtonGroup>,
    );

    expect(document.querySelector('[data-slot="button-group-separator"]')).not.toBeNull();
  });

  it("isDisabled помечает группу data-disabled", () => {
    render(
      <ButtonGroup isDisabled>
        <Button>Первый</Button>
      </ButtonGroup>,
    );

    expect(group()).toHaveAttribute("data-disabled", "true");
  });

  /*
   * Зафиксированное расхождение с эталоном (docs/superpowers/specs/2026-10-02-react-package-button-design.md,
   * раздел 12): у нашей Button нет точек подключения к ButtonGroup, поэтому isDisabled группы
   * НЕ доезжает до дочерних кнопок — эталон переносит его своим контекстом внутри button.tsx.
   * Тест исполняет расхождение: кто вернёт точки подключения, обязан сознательно обновить его.
   */
  it("isDisabled группы не отключает дочерние кнопки", async () => {
    const onPress = vi.fn();

    render(
      <ButtonGroup isDisabled>
        <Button onPress={onPress}>Первый</Button>
      </ButtonGroup>,
    );

    const button = screen.getByRole("button", {name: "Первый"});

    expect(button).toBeEnabled();

    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("кнопка остаётся рабочей внутри группы", async () => {
    const onPress = vi.fn();

    render(
      <ButtonGroup>
        <Button onPress={onPress}>Первый</Button>
        <Button>
          <ButtonGroup.Separator />
          Вторый
        </Button>
      </ButtonGroup>,
    );

    await user.click(screen.getByRole("button", {name: "Первый"}));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
