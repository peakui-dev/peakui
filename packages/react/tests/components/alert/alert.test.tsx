import {render, screen} from "@peakui/testing/helpers";
import {createRef, use} from "react";

import {Alert, AlertRoot} from "@/components/alert/index.ts";
import {Surface, SurfaceContext} from "@/components/surface/index.ts";

/*
 * Зонд — потребитель SurfaceContext внутри Alert: порт проверяет, что Alert задаёт вложенным
 * контролам окружающий уровень поверхности, а не наследует внешний.
 */
const surfaceProbe = () => {
  const values: unknown[] = [];
  const Probe = () => {
    values.push(use(SurfaceContext));

    return null;
  };

  return {Probe, values};
};

describe("Alert", () => {
  describe("рендеринг", () => {
    it("рисует div без роли, с data-slot и children", () => {
      render(
        <Alert>
          <Alert.Content>Контент</Alert.Content>
        </Alert>,
      );

      const element = screen.getByText("Контент").parentElement;

      expect(element?.tagName).toBe("DIV");
      expect(element).toHaveAttribute("data-slot", "alert-root");
      expect(element).not.toHaveAttribute("role");
    });

    it("без status даёт модификатор default", () => {
      render(
        <Alert>
          <Alert.Content>Контент</Alert.Content>
        </Alert>,
      );

      expect(screen.getByText("Контент").parentElement).toHaveClass("alert--default");
    });

    it.each([
      ["default", "alert--default"],
      ["accent", "alert--accent"],
      ["success", "alert--success"],
      ["warning", "alert--warning"],
      ["danger", "alert--danger"],
    ] as const)("status «%s» добавляет свой модификатор", (status, modifier) => {
      render(
        <Alert status={status}>
          <Alert.Content>Контент</Alert.Content>
        </Alert>,
      );

      expect(screen.getByText("Контент").parentElement).toHaveClass(modifier);
    });

    it("объединяет className с классами блока", () => {
      render(
        <Alert className="custom">
          <Alert.Content>Контент</Alert.Content>
        </Alert>,
      );

      expect(screen.getByText("Контент").parentElement?.className).toEqual(
        expect.stringContaining("custom"),
      );
    });

    it("разливает остальные пропсы на элемент", () => {
      render(
        <Alert aria-label="Уведомление" data-foo="bar" id="notice" lang="en">
          <Alert.Content>Контент</Alert.Content>
        </Alert>,
      );

      const element = screen.getByText("Контент").parentElement;

      expect(element).toHaveAttribute("id", "notice");
      expect(element).toHaveAttribute("data-foo", "bar");
      expect(element).toHaveAttribute("aria-label", "Уведомление");
      expect(element).toHaveAttribute("lang", "en");
    });

    it("работает одинаково как Alert.Root и AlertRoot", () => {
      render(
        <>
          <Alert.Root>
            <Alert.Content>Namespaced</Alert.Content>
          </Alert.Root>
          <AlertRoot>
            <Alert.Content>Flat</Alert.Content>
          </AlertRoot>
        </>,
      );

      for (const name of ["Namespaced", "Flat"]) {
        expect(screen.getByText(name).parentElement).toHaveAttribute("data-slot", "alert-root");
      }
    });
  });

  describe("части", () => {
    it("Indicator без children рисует div со стандартной иконкой статуса", () => {
      const {container} = render(
        <Alert>
          <Alert.Indicator />
        </Alert>,
      );

      const indicator = container.querySelector('[data-slot="alert-indicator"]');

      expect(indicator?.tagName).toBe("DIV");
      expect(indicator?.querySelector('[data-slot="alert-default-icon"]')).toBeInTheDocument();
    });

    it.each(["accent", "success", "warning", "danger"] as const)(
      "Indicator статуса «%s» тоже получает стандартную иконку",
      (status) => {
        const {container} = render(
          <Alert status={status}>
            <Alert.Indicator />
          </Alert>,
        );

        expect(
          container.querySelector('[data-slot="alert-indicator"] [data-slot="alert-default-icon"]'),
        ).toBeInTheDocument();
      },
    );

    it("Indicator заменяет стандартную иконку своими children", () => {
      const {container} = render(
        <Alert>
          <Alert.Indicator>
            <span>Кастомный индикатор</span>
          </Alert.Indicator>
        </Alert>,
      );

      const indicator = screen.getByText("Кастомный индикатор").parentElement;

      expect(indicator).toHaveAttribute("data-slot", "alert-indicator");
      expect(container.querySelector('[data-slot="alert-default-icon"]')).not.toBeInTheDocument();
    });

    it("Content рисует div с data-slot", () => {
      render(<Alert.Content>Контент</Alert.Content>);

      const element = screen.getByText("Контент");

      expect(element.tagName).toBe("DIV");
      expect(element).toHaveAttribute("data-slot", "alert-content");
    });

    it("Title рисует p с data-slot", () => {
      render(<Alert.Title>Заголовок</Alert.Title>);

      const element = screen.getByText("Заголовок");

      expect(element.tagName).toBe("P");
      expect(element).toHaveAttribute("data-slot", "alert-title");
    });

    it("Description рисует span с data-slot", () => {
      render(<Alert.Description>Описание</Alert.Description>);

      const element = screen.getByText("Описание");

      expect(element.tagName).toBe("SPAN");
      expect(element).toHaveAttribute("data-slot", "alert-description");
    });
  });

  describe("SurfaceContext", () => {
    it("задаёт вложенным контролам вариант default, а не наследует внешний", () => {
      const {Probe, values} = surfaceProbe();

      render(
        <Surface variant="secondary">
          <Alert>
            <Probe />
          </Alert>
        </Surface>,
      );

      expect(values.at(-1)).toEqual({variant: "default"});
    });
  });

  describe("полиморфизм", () => {
    it("render подменяет элемент и пробрасывает ref дальше", () => {
      const ref = createRef<HTMLElement>();

      render(
        <Alert<"section"> ref={ref} render={(props) => <section {...props} />}>
          <Alert.Content>Контент</Alert.Content>
        </Alert>,
      );

      const section = screen.getByText("Контент").parentElement;

      expect(section?.tagName).toBe("SECTION");
      expect(section).toHaveAttribute("data-slot", "alert-root");
      expect(ref.current).toBe(section);
    });

    it("принимает ref как обычный проп", () => {
      const ref = createRef<HTMLDivElement>();

      render(
        <Alert ref={ref}>
          <Alert.Content>Контент</Alert.Content>
        </Alert>,
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toBe(screen.getByText("Контент").parentElement);
    });
  });
});
