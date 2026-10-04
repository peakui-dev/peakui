import {render, screen} from "@peakui/testing/helpers";
import {createRef, use} from "react";

import {Surface, SurfaceContext, SurfaceRoot} from "@/components/surface/index.ts";

/*
 * Зонд — тот самый потребитель, ради которого контекст существует: вложенный контрол, читающий
 * окружающий уровень поверхности. Значения складываются при каждом рендере, чтобы можно было
 * проверять и стабильность ссылок между рендерами.
 */
const contextProbe = () => {
  const values: unknown[] = [];
  const Probe = () => {
    values.push(use(SurfaceContext));

    return null;
  };

  return {Probe, values};
};

const classesOf = (element: Element) => [...element.classList].sort();

describe("Surface", () => {
  describe("рендеринг", () => {
    it("рисует div без роли, с data-slot и children", () => {
      render(<Surface>Контент</Surface>);

      const element = screen.getByText("Контент");

      expect(element.tagName).toBe("DIV");
      expect(element).toHaveAttribute("data-slot", "surface");
      expect(element).not.toHaveAttribute("role");
    });

    it("без variant даёт базовый блок и модификатор default", () => {
      render(<Surface>Контент</Surface>);

      expect(classesOf(screen.getByText("Контент"))).toEqual(["surface", "surface--default"]);
    });

    it.each([
      ["default", "surface--default"],
      ["secondary", "surface--secondary"],
      ["tertiary", "surface--tertiary"],
      ["transparent", "surface--transparent"],
    ] as const)("вариант «%s» добавляет только свой модификатор", (variant, modifier) => {
      render(<Surface variant={variant}>Контент</Surface>);

      expect(classesOf(screen.getByText("Контент"))).toEqual(["surface", modifier]);
    });

    /*
     * Риск из спеки: transparent наследует текст от базы (.surface { text-foreground }), а не от
     * уровня — «починка» до text-surface-foreground разошлась бы молча. Текст живёт в CSS, до
     * которого jsdom не доходит, поэтому пин — точный набор классов: ни модификатора уровня
     * (surface--default), ни какого-либо *-foreground в JS-классах быть не должно.
     */
    it("transparent наследует базовый текст, без foreground уровня", () => {
      render(<Surface variant="transparent">Контент</Surface>);
      const element = screen.getByText("Контент");

      expect(classesOf(element)).toEqual(["surface", "surface--transparent"]);
      expect(element.className).not.toMatch(/foreground/);
    });

    it("объединяет className с классами блока", () => {
      render(<Surface className="custom">Контент</Surface>);

      expect(classesOf(screen.getByText("Контент"))).toEqual([
        "custom",
        "surface",
        "surface--default",
      ]);
    });

    it("разливает остальные пропсы на элемент", () => {
      render(
        <Surface aria-label="Панель" data-foo="bar" id="panel" lang="en">
          Контент
        </Surface>,
      );

      const element = screen.getByText("Контент");

      expect(element).toHaveAttribute("id", "panel");
      expect(element).toHaveAttribute("data-foo", "bar");
      expect(element).toHaveAttribute("aria-label", "Панель");
      expect(element).toHaveAttribute("lang", "en");
    });

    it("работает одинаково как Surface.Root и SurfaceRoot", () => {
      render(
        <>
          <Surface.Root>Namespaced</Surface.Root>
          <SurfaceRoot>Flat</SurfaceRoot>
        </>,
      );

      for (const name of ["Namespaced", "Flat"]) {
        expect(screen.getByText(name)).toHaveAttribute("data-slot", "surface");
      }
    });
  });

  describe("SurfaceContext", () => {
    it("предоставляет свой вариант потребителям контекста", () => {
      const {Probe, values} = contextProbe();

      render(
        <Surface variant="secondary">
          <Probe />
        </Surface>,
      );

      expect(values.at(-1)).toEqual({variant: "secondary"});
    });

    /* Дефолт попадает в контекст явно, а не как undefined — это даёт деструктуризация variant = "default". */
    it("вариант по умолчанию тоже доезжает до контекста", () => {
      const {Probe, values} = contextProbe();

      render(
        <Surface>
          <Probe />
        </Surface>,
      );

      expect(values.at(-1)).toEqual({variant: "default"});
    });

    it("без провайдера контекст — пустой объект", () => {
      const {Probe, values} = contextProbe();

      render(<Probe />);

      expect(values.at(-1)).toEqual({});
    });

    /* useMemo с [variant]: смена варианта даёт новое значение, тот же вариант — ту же ссылку. */
    it("значение контекста ссылочно стабильно между рендерами при том же варианте", () => {
      const {Probe, values} = contextProbe();
      const {rerender} = render(
        <Surface className="one">
          <Probe />
        </Surface>,
      );

      rerender(
        <Surface className="two">
          <Probe />
        </Surface>,
      );

      expect(values.length).toBeGreaterThanOrEqual(2);
      expect(values.every((value) => value === values[0])).toBe(true);
    });

    it("смена варианта обновляет значение контекста", () => {
      const {Probe, values} = contextProbe();
      const {rerender} = render(
        <Surface variant="default">
          <Probe />
        </Surface>,
      );

      rerender(
        <Surface variant="tertiary">
          <Probe />
        </Surface>,
      );

      expect(values.at(-1)).toEqual({variant: "tertiary"});
    });
  });

  describe("полиморфизм", () => {
    it("render подменяет элемент и пробрасывает ref дальше", () => {
      const ref = createRef<HTMLElement>();

      render(
        <Surface<"section"> ref={ref} render={(props) => <section {...props} />}>
          Контент
        </Surface>,
      );

      const section = screen.getByText("Контент");

      expect(section.tagName).toBe("SECTION");
      expect(section).toHaveAttribute("data-slot", "surface");
      expect(ref.current).toBe(section);
    });

    /* Без forwardRef только этот тест доказывает, что ref доезжает до узла. */
    it("принимает ref как обычный проп", () => {
      const ref = createRef<HTMLDivElement>();

      render(<Surface ref={ref}>Контент</Surface>);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toBe(screen.getByText("Контент"));
    });
  });
});
