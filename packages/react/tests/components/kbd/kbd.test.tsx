import {render, screen} from "@peakui/testing/helpers";
import {createRef} from "react";

import {
  Kbd,
  KbdAbbr,
  KbdContent,
  KbdRoot,
  kbdKeysLabelMap,
  kbdKeysMap,
} from "@/components/kbd/index.ts";

describe("Kbd", () => {
  describe("рендеринг", () => {
    it("рисует kbd с data-slot и содержимым", () => {
      render(<Kbd>Esc</Kbd>);

      const element = screen.getByText("Esc");

      expect(element.tagName).toBe("KBD");
      expect(element).toHaveAttribute("data-slot", "kbd");
    });

    it("без variant даёт только базовый блок", () => {
      render(<Kbd>Esc</Kbd>);

      const element = screen.getByText("Esc");

      expect(element).toHaveClass("kbd");
      expect(element).not.toHaveClass("kbd--default");
      expect(element).not.toHaveClass("kbd--light");
    });

    it.each([
      ["default", "kbd--default"],
      ["light", "kbd--light"],
    ] as const)("вариант «%s» добавляет свой модификатор на корень", (variant, modifier) => {
      render(
        <Kbd variant={variant}>
          <Kbd.Content>Esc</Kbd.Content>
        </Kbd>,
      );

      expect(screen.getByText("Esc").closest("kbd")).toHaveClass(modifier);
    });

    it("объединяет className с классами блока", () => {
      render(<Kbd className="custom">Esc</Kbd>);

      expect(screen.getByText("Esc")).toHaveClass("kbd", "custom");
    });

    it("разливает остальные пропсы на элемент", () => {
      render(
        <Kbd aria-label="Горячая клавиша" data-foo="bar" id="escape" lang="en">
          Esc
        </Kbd>,
      );

      const element = screen.getByText("Esc");

      expect(element).toHaveAttribute("id", "escape");
      expect(element).toHaveAttribute("data-foo", "bar");
      expect(element).toHaveAttribute("aria-label", "Горячая клавиша");
      expect(element).toHaveAttribute("lang", "en");
    });

    it("работает одинаково как Kbd.Root и KbdRoot", () => {
      render(
        <>
          <Kbd.Root>Namespaced</Kbd.Root>
          <KbdRoot>Flat</KbdRoot>
        </>,
      );

      for (const name of ["Namespaced", "Flat"]) {
        expect(screen.getByText(name)).toHaveAttribute("data-slot", "kbd");
      }
    });
  });

  describe("Kbd.Abbr", () => {
    it("рисует abbr с символом клавиши и полным именем в title", () => {
      render(
        <Kbd>
          <Kbd.Abbr keyValue="command" />
        </Kbd>,
      );

      const abbr = screen.getByTitle("Command");

      expect(abbr.tagName).toBe("ABBR");
      expect(abbr).toHaveTextContent("⌘");
      expect(abbr).toHaveAttribute("data-slot", "kbd-abbr");
    });

    it.each([
      ["shift", "⇧", "Shift"],
      ["ctrl", "⌃", "Control"],
      ["option", "⌥", "Option"],
      ["enter", "↵", "Enter"],
      ["escape", "⎋", "Escape"],
      ["tab", "⇥", "Tab"],
      ["up", "↑", "Up"],
      ["space", "␣", "Space"],
      ["fn", "Fn", "Fn"],
      ["win", "⌘", "Win"],
    ] as const)("клавиша «%s» даёт символ «%s» и имя «%s»", (keyValue, symbol, label) => {
      render(
        <Kbd>
          <Kbd.Abbr keyValue={keyValue} />
        </Kbd>,
      );

      expect(screen.getByTitle(label)).toHaveTextContent(symbol);
    });

    it("работает одинаково как Kbd.Abbr и KbdAbbr", () => {
      render(
        <Kbd>
          <Kbd.Abbr keyValue="command" />
          <KbdAbbr keyValue="shift" />
        </Kbd>,
      );

      expect(screen.getByTitle("Command")).toBeInTheDocument();
      expect(screen.getByTitle("Shift")).toBeInTheDocument();
    });

    it("className добавляется к классам слота abbr", () => {
      render(
        <Kbd>
          <Kbd.Abbr className="custom" keyValue="command" />
        </Kbd>,
      );

      expect(screen.getByTitle("Command")).toHaveClass("kbd__abbr", "custom");
    });

    it("разливает остальные пропсы на элемент", () => {
      render(
        <Kbd>
          <Kbd.Abbr data-foo="bar" keyValue="command" />
        </Kbd>,
      );

      expect(screen.getByTitle("Command")).toHaveAttribute("data-foo", "bar");
    });
  });

  describe("Kbd.Content", () => {
    it("рисует span с содержимым", () => {
      render(
        <Kbd>
          <Kbd.Content>K</Kbd.Content>
        </Kbd>,
      );

      const content = screen.getByText("K");

      expect(content.tagName).toBe("SPAN");
      expect(content).toHaveAttribute("data-slot", "kbd-content");
      expect(content).toHaveClass("kbd__content");
    });

    it("className добавляется к классам слота content", () => {
      render(
        <Kbd>
          <Kbd.Content className="custom">K</Kbd.Content>
        </Kbd>,
      );

      expect(screen.getByText("K")).toHaveClass("kbd__content", "custom");
    });

    it("работает одинаково как Kbd.Content и KbdContent", () => {
      render(
        <Kbd>
          <Kbd.Content>Namespaced</Kbd.Content>
          <KbdContent>Flat</KbdContent>
        </Kbd>,
      );

      expect(screen.getByText("Namespaced")).toHaveAttribute("data-slot", "kbd-content");
      expect(screen.getByText("Flat")).toHaveAttribute("data-slot", "kbd-content");
    });

    it("разливает остальные пропсы на элемент", () => {
      render(
        <Kbd>
          <Kbd.Content data-foo="bar">K</Kbd.Content>
        </Kbd>,
      );

      expect(screen.getByText("K")).toHaveAttribute("data-foo", "bar");
    });
  });

  describe("полиморфизм", () => {
    it("render подменяет элемент и пробрасывает ref дальше", () => {
      const ref = createRef<HTMLElement>();

      render(
        <Kbd<"span"> ref={ref} render={(props) => <span {...props} />}>
          Esc
        </Kbd>,
      );

      const span = screen.getByText("Esc");

      expect(span.tagName).toBe("SPAN");
      expect(span).toHaveAttribute("data-slot", "kbd");
      expect(ref.current).toBe(span);
    });

    /* Без forwardRef только этот тест доказывает, что ref доезжает до узла. */
    it("принимает ref как обычный проп", () => {
      const ref = createRef<HTMLElement>();

      render(<Kbd ref={ref}>Esc</Kbd>);

      expect(ref.current).toBe(screen.getByText("Esc"));
    });
  });

  describe("константы", () => {
    it("экспортирует карту символов и карту полных имён клавиш", () => {
      expect(kbdKeysMap["command"]).toBe("⌘");
      expect(kbdKeysMap["space"]).toBe("␣");
      expect(kbdKeysLabelMap["command"]).toBe("Command");
      expect(kbdKeysLabelMap["pageup"]).toBe("Page Up");
    });
  });
});
