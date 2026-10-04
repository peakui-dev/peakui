import {render, screen} from "@peakui/testing/helpers";
import {createRef, use} from "react";

import {Card, CardRoot} from "@/components/card/index.ts";
import {SurfaceContext} from "@/components/surface/index.ts";

/*
 * Зонд — потребитель SurfaceContext, который Card обязан обеспечить: вложенный контрол, читающий
 * окружающий уровень поверхности. Пустой объект означает, что провайдера нет.
 */
const contextProbe = () => {
  const values: unknown[] = [];
  const Probe = () => {
    values.push(use(SurfaceContext));

    return null;
  };

  return {Probe, values};
};

describe("Card", () => {
  describe("рендеринг", () => {
    it("рисует составной контент: заголовок третьего уровня, описание, контент и футер", () => {
      render(
        <Card>
          <Card.Header>
            <Card.Title>Заголовок</Card.Title>
            <Card.Description>Описание</Card.Description>
          </Card.Header>
          <Card.Content>Контент</Card.Content>
          <Card.Footer>Футер</Card.Footer>
        </Card>,
      );

      const title = screen.getByRole("heading", {level: 3, name: "Заголовок"});

      expect(title).toHaveAttribute("data-slot", "card-title");
      expect(screen.getByText("Описание")).toHaveAttribute("data-slot", "card-description");
      expect(screen.getByText("Контент")).toHaveAttribute("data-slot", "card-content");
      expect(screen.getByText("Футер")).toHaveAttribute("data-slot", "card-footer");
    });

    it('корень — div с data-slot="card" без роли', () => {
      render(<Card>Тело</Card>);

      const root = screen.getByText("Тело");

      expect(root.tagName).toBe("DIV");
      expect(root).toHaveAttribute("data-slot", "card");
      expect(root).not.toHaveAttribute("role");
    });

    it('шапка — div с data-slot="card-header"', () => {
      render(
        <Card>
          <Card.Header>Шапка</Card.Header>
        </Card>,
      );

      const header = screen.getByText("Шапка");

      expect(header.tagName).toBe("DIV");
      expect(header).toHaveAttribute("data-slot", "card-header");
    });

    it("описание — параграф по умолчанию", () => {
      render(
        <Card>
          <Card.Description>Текст</Card.Description>
        </Card>,
      );

      expect(screen.getByText("Текст").tagName).toBe("P");
    });
  });

  describe("варианты", () => {
    it("без variant даёт модификатор default", () => {
      render(<Card>Тело</Card>);

      expect(screen.getByText("Тело").className).toEqual(expect.stringContaining("card--default"));
    });

    it.each([
      ["default", "card--default"],
      ["secondary", "card--secondary"],
      ["tertiary", "card--tertiary"],
      ["transparent", "card--transparent"],
    ] as const)("вариант «%s» добавляет свой модификатор", (variant, modifier) => {
      render(<Card variant={variant}>Тело</Card>);

      expect(screen.getByText("Тело").className).toEqual(expect.stringContaining(modifier));
    });
  });

  describe("SurfaceContext", () => {
    it("непрозрачный вариант сообщает вложенным контролам уровень поверхности", () => {
      const {Probe, values} = contextProbe();

      render(
        <Card variant="secondary">
          <Probe />
        </Card>,
      );

      expect(values.at(-1)).toEqual({variant: "secondary"});
    });

    it("вариант по умолчанию тоже доезжает до контекста", () => {
      const {Probe, values} = contextProbe();

      render(
        <Card>
          <Probe />
        </Card>,
      );

      expect(values.at(-1)).toEqual({variant: "default"});
    });

    it("transparent не задаёт уровень поверхности — фон остаётся родительским", () => {
      const {Probe, values} = contextProbe();

      render(
        <Card variant="transparent">
          <Probe />
        </Card>,
      );

      expect(values.at(-1)).toEqual({});
    });
  });

  describe("композиция", () => {
    it("работает одинаково как Card.Root и CardRoot", () => {
      render(
        <>
          <Card.Root>Namespaced</Card.Root>
          <CardRoot>Flat</CardRoot>
        </>,
      );

      for (const name of ["Namespaced", "Flat"]) {
        expect(screen.getByText(name)).toHaveAttribute("data-slot", "card");
      }
    });

    it("объединяет className с классами блока", () => {
      render(<Card className="custom">Тело</Card>);

      expect(screen.getByText("Тело").className).toEqual(expect.stringContaining("custom"));
    });

    it("разливает остальные пропсы на элемент", () => {
      render(
        <Card aria-label="Карточка" data-foo="bar" id="card">
          Тело
        </Card>,
      );

      const root = screen.getByText("Тело");

      expect(root).toHaveAttribute("id", "card");
      expect(root).toHaveAttribute("data-foo", "bar");
      expect(root).toHaveAttribute("aria-label", "Карточка");
    });

    it("className части не убирает классы самой части", () => {
      render(
        <Card>
          <Card.Title className="custom-title">Заголовок</Card.Title>
        </Card>,
      );

      const title = screen.getByRole("heading", {name: "Заголовок"});

      expect(title.className).toEqual(expect.stringContaining("custom-title"));
      expect(title.className).toEqual(expect.stringContaining("card__title"));
    });
  });

  describe("полиморфизм", () => {
    it("render корня подменяет элемент и пробрасывает ref дальше", () => {
      const ref = createRef<HTMLElement>();

      render(
        <Card<"section"> ref={ref} render={(props) => <section {...props} />}>
          Тело
        </Card>,
      );

      const section = screen.getByText("Тело");

      expect(section.tagName).toBe("SECTION");
      expect(section).toHaveAttribute("data-slot", "card");
      expect(ref.current).toBe(section);
    });

    it("принимает ref как обычный проп", () => {
      const ref = createRef<HTMLDivElement>();

      render(<Card ref={ref}>Тело</Card>);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toBe(screen.getByText("Тело"));
    });

    it("render части подменяет её элемент, сохраняя роль и слот", () => {
      render(
        <Card>
          {/* The children travel inside the spread props; the rule cannot see them. */}
          {/* eslint-disable-next-line jsx-a11y/heading-has-content */}
          <Card.Title render={(props) => <h2 {...props} />}>Заголовок</Card.Title>
        </Card>,
      );

      expect(screen.getByRole("heading", {level: 2, name: "Заголовок"})).toHaveAttribute(
        "data-slot",
        "card-title",
      );
    });
  });
});
