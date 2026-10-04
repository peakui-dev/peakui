import {render, screen} from "@peakui/testing/helpers";
import {SeparatorContext} from "react-aria-components/Separator";
import {Provider} from "react-aria-components/slots";

import {Separator, SeparatorRoot} from "@/components/separator/index.ts";

const classesOf = (element: Element) => [...element.classList].sort();

/* Провайдер RAC — тот механизм, через который родитель (меню, группа) задаёт разделителю пропсы. */
const withSeparatorContext = (
  value: {orientation: "horizontal" | "vertical"},
  ui: React.ReactElement,
) => <Provider values={[[SeparatorContext, value]]}>{ui}</Provider>;

describe("Separator", () => {
  describe("рендеринг", () => {
    it("по умолчанию рисует hr: семантику разделителя несёт сам элемент", () => {
      render(<Separator />);

      const separator = screen.getByRole("separator");

      expect(separator.tagName).toBe("HR");
      expect(separator).toHaveAttribute("data-slot", "separator");
      /* Горизонталь — значение роли по умолчанию, aria-orientation для неё не выставляется. */
      expect(separator).not.toHaveAttribute("aria-orientation");
    });

    it("без пропсов даёт блок с модификаторами горизонтали и варианта default", () => {
      render(<Separator />);

      expect(classesOf(screen.getByRole("separator"))).toEqual([
        "separator",
        "separator--default",
        "separator--horizontal",
      ]);
    });

    it("помечает ориентацию атрибутом data-orientation", () => {
      render(<Separator />);

      expect(screen.getByRole("separator")).toHaveAttribute("data-orientation", "horizontal");
    });

    it("vertical рисует div с ролью separator и aria-orientation", () => {
      render(<Separator orientation="vertical" />);

      const separator = screen.getByRole("separator");

      expect(separator.tagName).toBe("DIV");
      expect(separator).toHaveAttribute("role", "separator");
      expect(separator).toHaveAttribute("aria-orientation", "vertical");
      expect(separator).toHaveAttribute("data-orientation", "vertical");
      expect(separator.className).toEqual(expect.stringContaining("separator--vertical"));
    });

    it.each([
      ["default", "separator--default"],
      ["secondary", "separator--secondary"],
      ["tertiary", "separator--tertiary"],
    ] as const)("вариант «%s» добавляет свой модификатор", (variant, modifier) => {
      render(<Separator variant={variant} />);

      expect(classesOf(screen.getByRole("separator"))).toContain(modifier);
    });

    it("объединяет className потребителя с классами блока", () => {
      render(<Separator className="my-4" />);

      expect(classesOf(screen.getByRole("separator"))).toEqual([
        "my-4",
        "separator",
        "separator--default",
        "separator--horizontal",
      ]);
    });

    it("разливает остальные пропсы на элемент", () => {
      /*
       * Набор не случаен: примитив фильтрует DOM-пропсы, и aria-hidden он, в отличие от
       * aria-label, id, lang и data-*, не пропускает — поведение RAC, а не нашего слоя.
       */
      render(<Separator aria-label="Разделитель" data-foo="bar" id="divider" lang="en" />);

      const separator = screen.getByRole("separator");

      expect(separator).toHaveAttribute("id", "divider");
      expect(separator).toHaveAttribute("data-foo", "bar");
      expect(separator).toHaveAttribute("aria-label", "Разделитель");
      expect(separator).toHaveAttribute("lang", "en");
    });

    it("работает одинаково как Separator.Root и SeparatorRoot", () => {
      render(
        <>
          <Separator.Root />
          <SeparatorRoot />
        </>,
      );

      expect(screen.getAllByRole("separator")).toHaveLength(2);
      for (const separator of screen.getAllByRole("separator")) {
        expect(separator).toHaveAttribute("data-slot", "separator");
      }
    });
  });

  describe("доступность", () => {
    /* Декоративный разделитель — без имени: читалка объявляет его паузой, а не элементом. */
    it("по умолчанию декоративен: доступного имени нет", () => {
      render(<Separator />);

      expect(screen.getByRole("separator")).not.toHaveAccessibleName();
    });

    it("aria-label даёт доступное имя", () => {
      render(<Separator aria-label="Конец раздела" />);

      expect(screen.getByRole("separator", {name: "Конец раздела"})).toBeInTheDocument();
    });
  });

  describe("контекст SeparatorContext", () => {
    it("наследует orientation из контекста, когда проп не задан", () => {
      render(withSeparatorContext({orientation: "vertical"}, <Separator />));

      const separator = screen.getByRole("separator");

      expect(separator.tagName).toBe("DIV");
      expect(separator).toHaveAttribute("aria-orientation", "vertical");
      expect(separator).toHaveAttribute("data-orientation", "vertical");
      expect(separator.className).toEqual(expect.stringContaining("separator--vertical"));
    });

    it("явный orientation сильнее контекста", () => {
      render(
        withSeparatorContext({orientation: "vertical"}, <Separator orientation="horizontal" />),
      );

      const separator = screen.getByRole("separator");

      expect(separator.tagName).toBe("HR");
      expect(separator).toHaveAttribute("data-orientation", "horizontal");
      expect(separator.className).toEqual(expect.stringContaining("separator--horizontal"));
    });
  });
});
