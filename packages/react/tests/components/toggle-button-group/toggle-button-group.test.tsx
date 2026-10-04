import {render, screen, setupUser} from "@peakui/testing/helpers";

import {ToggleButton} from "@/components/toggle-button/index.ts";
import {ToggleButtonGroup, ToggleButtonGroupRoot} from "@/components/toggle-button-group/index.ts";

describe("ToggleButtonGroup", () => {
  let user: ReturnType<typeof setupUser>;

  beforeAll(() => {
    user = setupUser();
  });

  describe("рендеринг", () => {
    it("выставляет BEM-блок и data-slot", () => {
      render(
        <ToggleButtonGroup data-testid="group" selectionMode="multiple">
          <ToggleButton id="bold">Жирный</ToggleButton>
        </ToggleButtonGroup>,
      );

      const group = screen.getByTestId("group");

      expect(group).toHaveClass("toggle-button-group");
      expect(group).toHaveAttribute("data-slot", "toggle-button-group");
    });

    it("ведёт себя одинаково как ToggleButtonGroup.Root и как ToggleButtonGroupRoot", () => {
      render(
        <>
          <ToggleButtonGroup.Root selectionMode="multiple">
            <ToggleButton id="bold">Жирный</ToggleButton>
          </ToggleButtonGroup.Root>
          <ToggleButtonGroupRoot selectionMode="multiple">
            <ToggleButton id="italic">Курсив</ToggleButton>
          </ToggleButtonGroupRoot>
        </>,
      );

      expect(screen.getByRole("button", {name: "Жирный"})).toBeInTheDocument();
      expect(screen.getByRole("button", {name: "Курсив"})).toBeInTheDocument();
    });

    it("рисует разделитель с data-slot и aria-hidden", () => {
      render(
        <ToggleButtonGroup selectionMode="multiple">
          <ToggleButton id="bold">Жирный</ToggleButton>
          <ToggleButton id="italic">
            <ToggleButtonGroup.Separator />
            Курсив
          </ToggleButton>
        </ToggleButtonGroup>,
      );

      const separator = document.querySelector('[data-slot="toggle-button-group-separator"]');

      expect(separator).not.toBeNull();
      expect(separator).toHaveAttribute("aria-hidden", "true");
    });

    it("добавляет модификаторы ориентации, ширины и отстыковки", () => {
      const {rerender} = render(
        <ToggleButtonGroup data-testid="group" orientation="vertical" selectionMode="multiple">
          <ToggleButton id="bold">Жирный</ToggleButton>
        </ToggleButtonGroup>,
      );

      expect(screen.getByTestId("group")).toHaveClass("toggle-button-group--vertical");

      rerender(
        <ToggleButtonGroup fullWidth data-testid="group" selectionMode="multiple">
          <ToggleButton id="bold">Жирный</ToggleButton>
        </ToggleButtonGroup>,
      );
      expect(screen.getByTestId("group")).toHaveClass("toggle-button-group--full-width");

      rerender(
        <ToggleButtonGroup isDetached data-testid="group" selectionMode="multiple">
          <ToggleButton id="bold">Жирный</ToggleButton>
        </ToggleButtonGroup>,
      );
      expect(screen.getByTestId("group")).toHaveClass("toggle-button-group--detached");
    });

    it("передаёт size дочерним ToggleButton через контекст", () => {
      render(
        <ToggleButtonGroup selectionMode="multiple" size="lg">
          <ToggleButton id="bold">Жирный</ToggleButton>
        </ToggleButtonGroup>,
      );

      expect(screen.getByRole("button", {name: "Жирный"})).toHaveClass("toggle-button--lg");
    });
  });

  describe("selectionMode multiple", () => {
    it("даёт роль toolbar и независимое переключение кнопок", async () => {
      const onSelectionChange = vi.fn();

      render(
        <ToggleButtonGroup selectionMode="multiple" onSelectionChange={onSelectionChange}>
          <ToggleButton id="bold">Жирный</ToggleButton>
          <ToggleButton id="italic">Курсив</ToggleButton>
        </ToggleButtonGroup>,
      );

      const bold = screen.getByRole("button", {name: "Жирный"});

      expect(screen.getByRole("toolbar")).toBeInTheDocument();
      expect(bold).toHaveAttribute("aria-pressed", "false");

      await user.click(bold);

      expect(bold).toHaveAttribute("aria-pressed", "true");
      expect(onSelectionChange).toHaveBeenCalledWith(new Set(["bold"]));

      await user.click(screen.getByRole("button", {name: "Курсив"}));

      expect(onSelectionChange).toHaveBeenCalledWith(new Set(["bold", "italic"]));

      /* Повторный клик снимает выбор: режим множественный, кнопки независимы. */
      await user.click(bold);

      expect(bold).toHaveAttribute("aria-pressed", "false");
      expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(["italic"]));
    });

    it("учитывает defaultSelectedKeys", () => {
      render(
        <ToggleButtonGroup defaultSelectedKeys={["bold"]} selectionMode="multiple">
          <ToggleButton id="bold">Жирный</ToggleButton>
          <ToggleButton id="italic">Курсив</ToggleButton>
        </ToggleButtonGroup>,
      );

      expect(screen.getByRole("button", {name: "Жирный"})).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", {name: "Курсив"})).toHaveAttribute("aria-pressed", "false");
    });
  });

  describe("selectionMode single", () => {
    it("даёт роли radiogroup и radio с взаимоисключающим выбором", async () => {
      const onSelectionChange = vi.fn();

      render(
        <ToggleButtonGroup selectionMode="single" onSelectionChange={onSelectionChange}>
          <ToggleButton id="left">Слева</ToggleButton>
          <ToggleButton id="center">По центру</ToggleButton>
        </ToggleButtonGroup>,
      );

      expect(screen.getByRole("radiogroup")).toBeInTheDocument();

      const left = screen.getByRole("radio", {name: "Слева"});
      const center = screen.getByRole("radio", {name: "По центру"});

      expect(left).toHaveAttribute("aria-checked", "false");

      await user.click(left);

      expect(left).toHaveAttribute("aria-checked", "true");
      expect(onSelectionChange).toHaveBeenCalledWith(new Set(["left"]));

      await user.click(center);

      expect(center).toHaveAttribute("aria-checked", "true");
      expect(left).toHaveAttribute("aria-checked", "false");
      expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(["center"]));
    });

    it("с disallowEmptySelection не отпускает единственный выбор", async () => {
      render(
        <ToggleButtonGroup
          disallowEmptySelection
          defaultSelectedKeys={["left"]}
          selectionMode="single"
        >
          <ToggleButton id="left">Слева</ToggleButton>
          <ToggleButton id="center">По центру</ToggleButton>
        </ToggleButtonGroup>,
      );

      const left = screen.getByRole("radio", {name: "Слева"});

      await user.click(left);

      expect(left).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("недоступность", () => {
    it("isDisabled на группе отключает каждую кнопку", () => {
      render(
        <ToggleButtonGroup isDisabled selectionMode="multiple">
          <ToggleButton id="bold">Жирный</ToggleButton>
          <ToggleButton id="italic">Курсив</ToggleButton>
        </ToggleButtonGroup>,
      );

      expect(screen.getByRole("button", {name: "Жирный"})).toBeDisabled();
      expect(screen.getByRole("button", {name: "Курсив"})).toBeDisabled();
    });
  });
});
