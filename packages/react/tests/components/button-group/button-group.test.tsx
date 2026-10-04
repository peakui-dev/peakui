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
   * Расхождение из docs/superpowers/specs/2026-10-02-react-package-button-design.md, раздел 12,
   * закрыто 2026-10-04: Button снова читает ButtonGroupContext и наследует size, variant,
   * isDisabled и fullWidth группы — слияние по образцу toggle-button.tsx, без маркера
   * BUTTON_GROUP_CHILD и без клонирования детей. Прямые пропы кнопки сильнее значений группы.
   */
  it("передаёт size группы дочерним кнопкам через контекст", () => {
    render(
      <ButtonGroup size="lg">
        <Button>Первый</Button>
      </ButtonGroup>,
    );

    expect(screen.getByRole("button", {name: "Первый"})).toHaveClass("button--lg");
  });

  it("передаёт variant группы дочерним кнопкам через контекст", () => {
    render(
      <ButtonGroup variant="secondary">
        <Button>Первый</Button>
      </ButtonGroup>,
    );

    expect(screen.getByRole("button", {name: "Первый"})).toHaveClass("button--secondary");
  });

  it("передаёт fullWidth группы дочерним кнопкам через контекст", () => {
    render(
      <ButtonGroup fullWidth>
        <Button>Первый</Button>
      </ButtonGroup>,
    );

    expect(screen.getByRole("button", {name: "Первый"})).toHaveClass("button--full-width");
  });

  it("isDisabled группы отключает дочерние кнопки", async () => {
    const onPress = vi.fn();

    render(
      <ButtonGroup isDisabled>
        <Button onPress={onPress}>Первый</Button>
      </ButtonGroup>,
    );

    const button = screen.getByRole("button", {name: "Первый"});

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("data-disabled", "true");

    await user.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("явные size и variant кнопки перекрывают значения группы", () => {
    render(
      <ButtonGroup size="lg" variant="secondary">
        <Button size="sm" variant="danger">
          Первый
        </Button>
      </ButtonGroup>,
    );

    const button = screen.getByRole("button", {name: "Первый"});

    expect(button).toHaveClass("button--sm");
    expect(button).toHaveClass("button--danger");
    expect(button).not.toHaveClass("button--lg");
    expect(button).not.toHaveClass("button--secondary");
  });

  it("кнопка с isDisabled={false} внутри отключённой группы остаётся включённой", async () => {
    const onPress = vi.fn();

    render(
      <ButtonGroup isDisabled>
        <Button isDisabled={false} onPress={onPress}>
          Первый
        </Button>
      </ButtonGroup>,
    );

    const button = screen.getByRole("button", {name: "Первый"});

    expect(button).toBeEnabled();

    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  /*
   * Кнопка вне группы читает пустой контекст по умолчанию: ни одно значение группы не
   * подтекает, остаются дефолты variant'ов (md/primary).
   */
  it("кнопка вне группы не наследует значения контекста", () => {
    render(<Button>Отдельная</Button>);

    const button = screen.getByRole("button", {name: "Отдельная"});

    expect(button).toHaveClass("button--md");
    expect(button).not.toHaveClass("button--full-width");
    expect(button).toBeEnabled();
  });

  /*
   * Слияние слепо к глубине: маркера прямого ребёнка из эталона нет (он протекал бы лишним
   * DOM-атрибутом), поэтому наследует любая кнопка под провайдером. Текущие группы рендерят
   * прямых детей — глубина их не различает, и это принято.
   */
  it("наследование слепо к глубине вложения", () => {
    render(
      <ButtonGroup size="lg">
        <div>
          <Button>Глубокая</Button>
        </div>
      </ButtonGroup>,
    );

    expect(screen.getByRole("button", {name: "Глубокая"})).toHaveClass("button--lg");
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
