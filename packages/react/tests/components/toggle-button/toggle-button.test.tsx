import {fireEvent, render, screen, setupUser} from "@peakui/testing/helpers";

import {ToggleButton, ToggleButtonRoot} from "@/components/toggle-button/index.ts";

const pointerOpts = {
  button: 0,
  clientX: 1,
  clientY: 1,
  pointerId: 1,
  pointerType: "mouse",
} as const;

/* Последовательность usePress в jsdom: pointerDown, затем pointerUp вместе с click. */
const pressDown = (element: HTMLElement) => fireEvent.pointerDown(element, pointerOpts);
const pressUp = (element: HTMLElement) => {
  fireEvent.pointerUp(element, pointerOpts);
  fireEvent.click(element, {button: 0});
};

describe("ToggleButton", () => {
  let user: ReturnType<typeof setupUser>;

  beforeAll(() => {
    user = setupUser();
  });

  describe("рендеринг", () => {
    it("рисует кнопку с ролью и доступным именем", () => {
      render(<ToggleButton>Жирный</ToggleButton>);

      expect(screen.getByRole("button", {name: "Жирный"})).toBeInTheDocument();
    });

    it("выставляет BEM-блок и data-slot", () => {
      render(<ToggleButton>Жирный</ToggleButton>);
      const button = screen.getByRole("button", {name: "Жирный"});

      expect(button).toHaveClass("toggle-button");
      expect(button).toHaveAttribute("data-slot", "toggle-button");
    });

    it("ведёт себя одинаково как ToggleButton.Root и как ToggleButtonRoot", () => {
      render(
        <>
          <ToggleButton.Root>Жирный</ToggleButton.Root>
          <ToggleButtonRoot>Курсив</ToggleButtonRoot>
        </>,
      );

      expect(screen.getByRole("button", {name: "Жирный"})).toHaveAttribute(
        "data-slot",
        "toggle-button",
      );
      expect(screen.getByRole("button", {name: "Курсив"})).toHaveAttribute(
        "data-slot",
        "toggle-button",
      );
    });

    it("объединяет className потребителя с классом блока", () => {
      render(<ToggleButton className="custom">Жирный</ToggleButton>);

      const button = screen.getByRole("button", {name: "Жирный"});

      expect(button).toHaveClass("toggle-button");
      expect(button).toHaveClass("custom");
    });
  });

  describe("варианты и размеры", () => {
    it.each([
      ["sm", "toggle-button--sm"],
      ["md", "toggle-button--md"],
      ["lg", "toggle-button--lg"],
    ] as const)("размер «%s» добавляет свой модификатор", (size, modifier) => {
      render(<ToggleButton size={size}>Жирный</ToggleButton>);

      expect(screen.getByRole("button", {name: "Жирный"})).toHaveClass(modifier);
    });

    it.each([
      ["default", "toggle-button--default"],
      ["ghost", "toggle-button--ghost"],
    ] as const)("вариант «%s» добавляет свой модификатор", (variant, modifier) => {
      render(<ToggleButton variant={variant}>Жирный</ToggleButton>);

      expect(screen.getByRole("button", {name: "Жирный"})).toHaveClass(modifier);
    });

    it("isIconOnly добавляет модификатор", () => {
      render(
        <ToggleButton isIconOnly aria-label="Жирный">
          B
        </ToggleButton>,
      );

      expect(screen.getByRole("button", {name: "Жирный"})).toHaveClass("toggle-button--icon-only");
    });
  });

  describe("выбранность", () => {
    it("объявляется aria-pressed и не выбрана по умолчанию", () => {
      render(<ToggleButton>Жирный</ToggleButton>);

      expect(screen.getByRole("button", {name: "Жирный"})).toHaveAttribute("aria-pressed", "false");
    });

    it("переключает выбранность по клику", async () => {
      const onChange = vi.fn();

      render(<ToggleButton onChange={onChange}>Жирный</ToggleButton>);
      const button = screen.getByRole("button", {name: "Жирный"});

      await user.click(button);
      expect(button).toHaveAttribute("aria-pressed", "true");
      expect(button).toHaveAttribute("data-selected", "true");
      expect(onChange).toHaveBeenCalledWith(true);

      await user.click(button);
      expect(button).toHaveAttribute("aria-pressed", "false");
      expect(onChange).toHaveBeenCalledWith(false);
    });

    it("учитывает defaultSelected без управления", () => {
      render(<ToggleButton defaultSelected>Жирный</ToggleButton>);

      expect(screen.getByRole("button", {name: "Жирный"})).toHaveAttribute("aria-pressed", "true");
    });

    it("поддерживает управляемый isSelected", async () => {
      const onChange = vi.fn();

      const {rerender} = render(
        <ToggleButton isSelected={false} onChange={onChange}>
          Жирный
        </ToggleButton>,
      );
      const button = screen.getByRole("button", {name: "Жирный"});

      expect(button).toHaveAttribute("aria-pressed", "false");

      await user.click(button);
      expect(onChange).toHaveBeenCalledWith(true);

      rerender(
        <ToggleButton isSelected onChange={onChange}>
          Жирный
        </ToggleButton>,
      );
      expect(screen.getByRole("button", {name: "Жирный"})).toHaveAttribute("aria-pressed", "true");
    });

    it("передаёт render-props детям как функции", () => {
      render(
        <ToggleButton defaultSelected>
          {({isSelected}) => (isSelected ? "Выбрано" : "Не выбрано")}
        </ToggleButton>,
      );

      expect(screen.getByRole("button", {name: "Выбрано"})).toBeInTheDocument();
    });
  });

  describe("клавиатура", () => {
    it("активируется Enter и Space", async () => {
      const onChange = vi.fn();

      render(<ToggleButton onChange={onChange}>Жирный</ToggleButton>);
      const button = screen.getByRole("button", {name: "Жирный"});

      await user.tab();
      expect(button).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(button).toHaveAttribute("aria-pressed", "true");
      expect(onChange).toHaveBeenCalledWith(true);

      await user.keyboard(" ");
      expect(button).toHaveAttribute("aria-pressed", "false");
      expect(onChange).toHaveBeenCalledWith(false);
    });

    it("показывает focus-visible при фокусе с клавиатуры", async () => {
      render(<ToggleButton>Жирный</ToggleButton>);
      const button = screen.getByRole("button", {name: "Жирный"});

      await user.tab();

      expect(button).toHaveFocus();
      expect(button).toHaveAttribute("data-focus-visible", "true");
    });
  });

  describe("состояния", () => {
    it("недоступна isDisabled и не переключается", async () => {
      const onChange = vi.fn();

      render(
        <ToggleButton isDisabled onChange={onChange}>
          Жирный
        </ToggleButton>,
      );
      const button = screen.getByRole("button", {name: "Жирный"});

      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("data-disabled", "true");

      await user.click(button);

      expect(onChange).not.toHaveBeenCalled();
      expect(button).toHaveAttribute("aria-pressed", "false");
    });

    it("ставит data-hovered при наведении", async () => {
      render(<ToggleButton>Жирный</ToggleButton>);
      const button = screen.getByRole("button", {name: "Жирный"});

      await user.hover(button);
      expect(button).toHaveAttribute("data-hovered", "true");

      await user.unhover(button);
      expect(button).not.toHaveAttribute("data-hovered");
    });

    it("ставит data-pressed на время нажатия", () => {
      render(<ToggleButton>Жирный</ToggleButton>);
      const button = screen.getByRole("button", {name: "Жирный"});

      pressDown(button);
      expect(button).toHaveAttribute("data-pressed", "true");

      pressUp(button);
      expect(button).not.toHaveAttribute("data-pressed");
    });
  });
});
