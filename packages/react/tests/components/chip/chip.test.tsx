import {render, screen} from "@peakui/testing/helpers";
import {createRef} from "react";

import {Chip, ChipLabel, ChipRoot} from "@/components/chip/index.ts";

describe("Chip", () => {
  describe("рендеринг", () => {
    it("рисует span с data-slot и текстом", () => {
      render(<Chip>Тег</Chip>);

      const element = screen.getByText("Тег");

      expect(element.tagName).toBe("SPAN");
      expect(element.closest('[data-slot="chip"]')).not.toBeNull();
    });

    it("оборачивает строкового ребёнка в метку", () => {
      render(<Chip>Тег</Chip>);

      const label = screen.getByText("Тег");

      expect(label).toHaveAttribute("data-slot", "chip-label");
      expect(label.parentElement).toHaveAttribute("data-slot", "chip");
    });

    it("оборачивает числового ребёнка в метку", () => {
      render(<Chip>{7}</Chip>);

      expect(screen.getByText("7")).toHaveAttribute("data-slot", "chip-label");
    });

    it("передаёт элементного ребёнка без обёртки", () => {
      render(
        <Chip>
          <span>Готово</span>
        </Chip>,
      );

      const inner = screen.getByText("Готово");

      expect(inner).not.toHaveAttribute("data-slot", "chip-label");
      expect(inner.parentElement).toHaveAttribute("data-slot", "chip");
    });

    it("рисует явную метку тем же слотом", () => {
      render(
        <Chip>
          <Chip.Label>Тег</Chip.Label>
        </Chip>,
      );

      expect(screen.getByText("Тег")).toHaveAttribute("data-slot", "chip-label");
    });

    it("объединяет className с классами блока", () => {
      render(<Chip className="custom">Тег</Chip>);

      const label = screen.getByText("Тег");

      expect(label.parentElement).toHaveClass("custom");
      expect(label.parentElement).toHaveClass("chip");
    });

    it("разливает остальные пропсы на элемент", () => {
      render(
        <Chip aria-label="Статус" data-foo="bar" id="chip" lang="en">
          Тег
        </Chip>,
      );

      const element = screen.getByText("Тег").parentElement;

      expect(element).toHaveAttribute("id", "chip");
      expect(element).toHaveAttribute("data-foo", "bar");
      expect(element).toHaveAttribute("aria-label", "Статус");
      expect(element).toHaveAttribute("lang", "en");
    });
  });

  describe("варианты", () => {
    it("без пропсов даёт дефолтный цвет", () => {
      render(<Chip>Тег</Chip>);

      expect(screen.getByText("Тег").parentElement).toHaveClass("chip--default");
    });

    it.each([
      ["accent", "chip--accent"],
      ["danger", "chip--danger"],
      ["default", "chip--default"],
      ["success", "chip--success"],
      ["warning", "chip--warning"],
    ] as const)("цвет «%s» добавляет свой модификатор", (color, modifier) => {
      render(<Chip color={color}>Тег</Chip>);

      expect(screen.getByText("Тег").parentElement).toHaveClass(modifier);
    });

    it.each([
      ["primary", "chip--primary"],
      ["secondary", "chip--secondary"],
      ["soft", "chip--soft"],
      ["tertiary", "chip--tertiary"],
    ] as const)("вариант «%s» добавляет свой модификатор", (variant, modifier) => {
      render(<Chip variant={variant}>Тег</Chip>);

      expect(screen.getByText("Тег").parentElement).toHaveClass(modifier);
    });

    it.each([
      ["sm", "chip--sm"],
      ["md", "chip--md"],
      ["lg", "chip--lg"],
    ] as const)("размер «%s» добавляет свой модификатор", (size, modifier) => {
      render(<Chip size={size}>Тег</Chip>);

      expect(screen.getByText("Тег").parentElement).toHaveClass(modifier);
    });
  });

  describe("стили вызова", () => {
    it("работает одинаково как Chip.Root и ChipRoot", () => {
      render(
        <>
          <Chip.Root>Namespaced</Chip.Root>
          <ChipRoot>Flat</ChipRoot>
        </>,
      );

      for (const name of ["Namespaced", "Flat"]) {
        expect(screen.getByText(name).parentElement).toHaveAttribute("data-slot", "chip");
      }
    });

    it("метка работает одинаково как Chip.Label и ChipLabel", () => {
      render(
        <>
          <Chip>
            <Chip.Label>Namespaced</Chip.Label>
          </Chip>
          <Chip>
            <ChipLabel>Flat</ChipLabel>
          </Chip>
        </>,
      );

      for (const name of ["Namespaced", "Flat"]) {
        expect(screen.getByText(name)).toHaveAttribute("data-slot", "chip-label");
      }
    });

    it("метка вне Root деградирует без падения", () => {
      render(<ChipLabel className="custom">Сирота</ChipLabel>);

      expect(screen.getByText("Сирота")).toHaveAttribute("data-slot", "chip-label");
      expect(screen.getByText("Сирота")).toHaveClass("custom");
    });

    it("метка наследует слоты Root через контекст", () => {
      render(
        <Chip color="danger">
          <ChipLabel>Тег</ChipLabel>
        </Chip>,
      );

      expect(screen.getByText("Тег")).toHaveClass("chip__label");
    });
  });

  describe("полиморфизм", () => {
    it("render подменяет элемент и пробрасывает ref дальше", () => {
      const ref = createRef<HTMLElement>();

      render(
        <Chip<"article"> ref={ref} render={(props) => <article {...props} />}>
          Тег
        </Chip>,
      );

      const article = screen.getByText("Тег").closest("article");

      expect(article).toHaveAttribute("data-slot", "chip");
      expect(ref.current).toBe(article);
    });

    it("принимает ref как обычный проп", () => {
      const ref = createRef<HTMLSpanElement>();

      render(<Chip ref={ref}>Тег</Chip>);

      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
      expect(ref.current).toBe(screen.getByText("Тег").parentElement);
    });
  });
});
