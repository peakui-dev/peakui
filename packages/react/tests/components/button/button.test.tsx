import {fireEvent, render, screen, setupUser} from "@peakui/testing/helpers";
import {createRef} from "react";

import {Button} from "@/components/button";
import {Spinner} from "@/components/spinner";

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

describe("Button", () => {
  let user: ReturnType<typeof setupUser>;

  beforeAll(() => {
    user = setupUser();
  });

  it("renders with role and accessible name", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button", {name: "Save"})).toBeInTheDocument();
  });

  it("exposes BEM block and data-slot", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", {name: "Save"});

    expect(button.className).toEqual(expect.stringContaining("button"));
    expect(button).toHaveAttribute("data-slot", "button");
  });

  it("exposes variant BEM modifier", () => {
    render(<Button variant="secondary">Save</Button>);

    expect(screen.getByRole("button", {name: "Save"}).className).toEqual(
      expect.stringContaining("button--secondary"),
    );
  });

  it("supports data attribute passthrough", () => {
    render(<Button data-testid="save-btn">Save</Button>);

    expect(screen.getByTestId("save-btn")).toBeInTheDocument();
  });

  it("supports hover state", async () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", {name: "Save"});

    expect(button).not.toHaveAttribute("data-hovered");

    await user.hover(button);
    expect(button).toHaveAttribute("data-hovered", "true");

    await user.unhover(button);
    expect(button).not.toHaveAttribute("data-hovered");
  });

  it("supports press state", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", {name: "Save"});

    expect(button).not.toHaveAttribute("data-pressed");

    pressDown(button);
    expect(button).toHaveAttribute("data-pressed", "true");

    pressUp(button);
    expect(button).not.toHaveAttribute("data-pressed");
  });

  it("calls onPress on click", async () => {
    const onPress = vi.fn();

    render(<Button onPress={onPress}>Save</Button>);

    await user.click(screen.getByRole("button", {name: "Save"}));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("supports focus-visible via keyboard", async () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", {name: "Save"});

    expect(button).not.toHaveAttribute("data-focus-visible");

    await user.tab();
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute("data-focus-visible", "true");

    await user.tab();
    expect(button).not.toHaveAttribute("data-focus-visible");
  });

  it("supports disabled state and blocks press", async () => {
    const onPress = vi.fn();

    render(
      <Button isDisabled onPress={onPress}>
        Save
      </Button>,
    );
    const button = screen.getByRole("button", {name: "Save"});

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("data-disabled", "true");

    await user.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("exposes no hover state when disabled", async () => {
    render(<Button isDisabled>Save</Button>);
    const button = screen.getByRole("button", {name: "Save"});

    await user.hover(button);
    expect(button).not.toHaveAttribute("data-hovered");
  });

  it("supports keyboard activation with Enter and Space", async () => {
    const onPress = vi.fn();

    render(<Button onPress={onPress}>Save</Button>);
    const button = screen.getByRole("button", {name: "Save"});

    await user.tab();
    expect(button).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onPress).toHaveBeenCalledTimes(1);

    await user.keyboard(" ");
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it("supports render-prop children for press state", () => {
    render(<Button>{({isPressed}) => (isPressed ? "Pressed" : "Save")}</Button>);
    const button = screen.getByRole("button", {name: "Save"});

    pressDown(button);
    expect(button).toHaveTextContent("Pressed");

    pressUp(button);
    expect(button).toHaveTextContent("Save");
  });

  /* Review Focus 1: className потребителя обязан слиться с BEM-именами, а не заменить их. */
  it("merges a consumer className with the BEM names", () => {
    render(<Button className="mt-4">Save</Button>);
    const button = screen.getByRole("button", {name: "Save"});

    expect(button.className).toEqual(expect.stringContaining("button--primary"));
    expect(button.className).toEqual(expect.stringContaining("mt-4"));
  });

  /*
   * Review Focus 2, на той высоте, на которой это использует потребитель. Тест на
   * composeTwRenderProps проверяет функцию напрямую — он останется зелёным, если кто-то упростит
   * button.tsx до className={cx(className, styles)}: со строкой всё работает, а с функцией в
   * class попадёт "[object Object]". Ловится только отсюда.
   */
  it("accepts a function className and resolves it against render props", () => {
    render(
      <Button className={({isPressed}) => (isPressed ? "is-pressed-class" : "is-idle-class")}>
        Save
      </Button>,
    );
    const button = screen.getByRole("button", {name: "Save"});

    expect(button.className).toEqual(expect.stringContaining("button--primary"));
    expect(button.className).toEqual(expect.stringContaining("is-idle-class"));
    expect(button.className).not.toEqual(expect.stringContaining("[object Object]"));

    pressDown(button);
    expect(button.className).toEqual(expect.stringContaining("is-pressed-class"));

    pressUp(button);
    expect(button.className).toEqual(expect.stringContaining("is-idle-class"));
  });

  /* Review Focus 3: без forwardRef больше ничто не доказывает, что ref доезжает до узла. */
  it("forwards ref to the button element", () => {
    const ref = createRef<HTMLButtonElement>();

    render(<Button ref={ref}>Save</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  /* Review Focus 5: видимая половина isPending — нажатие не проходит, фокус остаётся. */
  it("blocks activation while pending but stays focusable", async () => {
    const onPress = vi.fn();

    render(
      <Button isPending onPress={onPress}>
        Save
      </Button>,
    );
    const button = screen.getByRole("button", {name: "Save"});

    expect(button).toHaveAttribute("data-pending", "true");

    await user.click(button);
    expect(onPress).not.toHaveBeenCalled();

    /*
     * Фокусируемость проверяется прямым focus(), а не user.tab(): нажатие выше уже оставило фокус
     * на кнопке, и tab увёл бы его прочь — первая версия теста падала именно на этом. Здесь важно
     * само свойство, а не порядок обхода.
     */
    button.focus();
    expect(button).toHaveFocus();
  });

  /*
   * Контраст, который и делает предыдущую проверку осмысленной: настоящий disabled фокус не
   * принимает, и именно этим pending от него отличается.
   */
  it("cannot hold focus when truly disabled, unlike pending", () => {
    render(<Button isDisabled>Save</Button>);
    const button = screen.getByRole("button", {name: "Save"});

    button.focus();
    expect(button).not.toHaveFocus();
  });

  /*
   * Рецепт pending из сторей, проверенный на доступное имя. Spinner — это role="status" с
   * aria-label="Loading", и внутри кнопки его метка вливается в её имя: без aria-hidden кнопка
   * объявляется как «Loading Сохраняем». Имя сверяется целиком, не подстрокой, иначе загрязнение
   * пролезет назад незамеченным — именно так оно и прошло в e2e.
   */
  it("does not let the pending indicator pollute the button name", () => {
    render(
      <Button isPending>
        <Spinner aria-hidden color="current" size="sm" />
        Сохраняем
      </Button>,
    );

    expect(screen.getByRole("button", {name: "Сохраняем"})).toBeInTheDocument();
  });

  it("names an icon-only button from aria-label", () => {
    render(
      <Button isIconOnly aria-label="More options">
        <span aria-hidden>…</span>
      </Button>,
    );

    expect(screen.getByRole("button", {name: "More options"})).toBeInTheDocument();
  });
});
