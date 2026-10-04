import {fireEvent, render, screen, setupUser} from "@peakui/testing/helpers";
import {createRef} from "react";

import {CloseButton, CloseButtonRoot} from "@/components/close-button";

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

describe("CloseButton", () => {
  let user: ReturnType<typeof setupUser>;

  beforeAll(() => {
    user = setupUser();
  });

  describe("рендер", () => {
    it("отрисовывает кнопку с доступным именем Close по умолчанию", () => {
      render(<CloseButton />);

      expect(screen.getByRole("button", {name: "Close"})).toBeInTheDocument();
    });

    it("позволяет потребителю переопределить aria-label", () => {
      render(<CloseButton aria-label="Закрыть окно" />);

      expect(screen.getByRole("button", {name: "Закрыть окно"})).toBeInTheDocument();
    });

    it("задаёт type=button по умолчанию, чтобы кнопка не отправляла форму", () => {
      render(<CloseButton />);

      expect(screen.getByRole("button", {name: "Close"})).toHaveAttribute("type", "button");
    });

    it("помечает корень data-slot и BEM-модификатором варианта", () => {
      render(<CloseButton />);

      const button = screen.getByRole("button", {name: "Close"});

      expect(button).toHaveAttribute("data-slot", "close-button");
      expect(button.className).toEqual(expect.stringContaining("close-button--default"));
    });

    it("рисует внутреннюю иконку крестика, когда children не заданы", () => {
      render(<CloseButton />);

      const icon = screen
        .getByRole("button", {name: "Close"})
        .querySelector('[data-slot="close-button-icon"]');

      expect(icon).toBeInTheDocument();
    });

    it("замещает иконку пользовательскими children", () => {
      render(<CloseButton>Закрыть</CloseButton>);

      /*
       * Имя остаётся «Close»: aria-label всегда сильнее текста содержимого, и своя метка у
       * потребителя — только через aria-label, не через children.
       */
      const button = screen.getByRole("button", {name: "Close"});

      expect(button).toHaveTextContent("Закрыть");
      expect(button.querySelector('[data-slot="close-button-icon"]')).not.toBeInTheDocument();
    });

    it("ведёт себя одинаково как CloseButton.Root и CloseButtonRoot", () => {
      render(
        <>
          <CloseButton.Root aria-label="Первый" />
          <CloseButtonRoot aria-label="Второй" />
        </>,
      );

      expect(screen.getByRole("button", {name: "Первый"})).toHaveAttribute(
        "data-slot",
        "close-button",
      );
      expect(screen.getByRole("button", {name: "Второй"})).toHaveAttribute(
        "data-slot",
        "close-button",
      );
    });
  });

  describe("взаимодействие", () => {
    it("вызывает onPress по клику", async () => {
      const onPress = vi.fn();

      render(<CloseButton onPress={onPress} />);

      await user.click(screen.getByRole("button", {name: "Close"}));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("активируется с клавиатуры Enter и Space", async () => {
      const onPress = vi.fn();

      render(<CloseButton onPress={onPress} />);
      const button = screen.getByRole("button", {name: "Close"});

      await user.tab();
      expect(button).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(onPress).toHaveBeenCalledTimes(1);

      await user.keyboard(" ");
      expect(onPress).toHaveBeenCalledTimes(2);
    });

    it("отдаёт render props в функцию children", () => {
      render(
        <CloseButton aria-label="Индикатор">
          {({isPressed}) => (isPressed ? "Нажато" : "Спокойно")}
        </CloseButton>,
      );

      const button = screen.getByRole("button", {name: "Индикатор"});

      expect(button).toHaveTextContent("Спокойно");

      pressDown(button);
      expect(button).toHaveTextContent("Нажато");

      pressUp(button);
      expect(button).toHaveTextContent("Спокойно");
    });

    it("поддерживает состояние hover", async () => {
      render(<CloseButton />);
      const button = screen.getByRole("button", {name: "Close"});

      expect(button).not.toHaveAttribute("data-hovered");

      await user.hover(button);
      expect(button).toHaveAttribute("data-hovered", "true");

      await user.unhover(button);
      expect(button).not.toHaveAttribute("data-hovered");
    });

    it("поддерживает состояние pressed", () => {
      render(<CloseButton />);
      const button = screen.getByRole("button", {name: "Close"});

      expect(button).not.toHaveAttribute("data-pressed");

      pressDown(button);
      expect(button).toHaveAttribute("data-pressed", "true");

      pressUp(button);
      expect(button).not.toHaveAttribute("data-pressed");
    });

    it("поддерживает data-focus-visible с клавиатуры", async () => {
      render(<CloseButton />);
      const button = screen.getByRole("button", {name: "Close"});

      expect(button).not.toHaveAttribute("data-focus-visible");

      await user.tab();
      expect(button).toHaveFocus();
      expect(button).toHaveAttribute("data-focus-visible", "true");

      await user.tab();
      expect(button).not.toHaveAttribute("data-focus-visible");
    });
  });

  describe("состояния", () => {
    it("блокирует нажатие и объявляет data-disabled в отключённом состоянии", async () => {
      const onPress = vi.fn();

      render(<CloseButton isDisabled onPress={onPress} />);
      const button = screen.getByRole("button", {name: "Close"});

      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("data-disabled", "true");

      await user.click(button);
      expect(onPress).not.toHaveBeenCalled();
    });

    it("не даёт hover-состояния в отключённом состоянии", async () => {
      render(<CloseButton isDisabled />);
      const button = screen.getByRole("button", {name: "Close"});

      await user.hover(button);
      expect(button).not.toHaveAttribute("data-hovered");
    });

    it("объявляет data-pending в состоянии ожидания и блокирует нажатие", async () => {
      const onPress = vi.fn();

      render(<CloseButton isPending onPress={onPress} />);
      const button = screen.getByRole("button", {name: "Close"});

      expect(button).toHaveAttribute("data-pending", "true");

      await user.click(button);
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe("кастомизация", () => {
    it("сливает className потребителя с BEM-именами", () => {
      render(<CloseButton className="mt-4" />);

      const button = screen.getByRole("button", {name: "Close"});

      expect(button.className).toEqual(expect.stringContaining("close-button--default"));
      expect(button.className).toEqual(expect.stringContaining("mt-4"));
    });

    it("принимает className-функцию и разрешает её по render props", () => {
      render(
        <CloseButton
          className={({isPressed}) => (isPressed ? "is-pressed-class" : "is-idle-class")}
        />,
      );

      const button = screen.getByRole("button", {name: "Close"});

      expect(button.className).toEqual(expect.stringContaining("close-button--default"));
      expect(button.className).toEqual(expect.stringContaining("is-idle-class"));
      expect(button.className).not.toEqual(expect.stringContaining("[object Object]"));

      pressDown(button);
      expect(button.className).toEqual(expect.stringContaining("is-pressed-class"));

      pressUp(button);
      expect(button.className).toEqual(expect.stringContaining("is-idle-class"));
    });

    it("пропускает произвольные data-атрибуты к кнопке", () => {
      render(<CloseButton data-testid="dismiss-btn" />);

      expect(screen.getByTestId("dismiss-btn")).toBeInTheDocument();
    });

    /* Без forwardRef только этот тест доказывает, что ref доезжает до узла. */
    it("доносит ref до элемента button", () => {
      const ref = createRef<HTMLButtonElement>();

      render(<CloseButton ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });
});
