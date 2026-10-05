import type {ComponentProps} from "react";

import {fireEvent, render, screen, setupUser} from "@peakui/testing/helpers";

import {NumberField, NumberFieldRoot} from "@/components/number-field/index.ts";

const pointerOpts = {
  button: 0,
  clientX: 1,
  clientY: 1,
  pointerId: 1,
  pointerType: "mouse",
} as const;

/* Последовательность usePress в jsdom: pointerDown, затем pointerUp вместе с click. */
const press = async (element: HTMLElement) => {
  fireEvent.pointerDown(element, pointerOpts);
  fireEvent.pointerUp(element, pointerOpts);
  fireEvent.click(element, {button: 0});
};

const stepper = () => (
  <>
    <NumberField.DecrementButton />
    <NumberField.Input />
    <NumberField.IncrementButton />
  </>
);

const renderField = (props: ComponentProps<typeof NumberField> = {}) =>
  render(
    <NumberField aria-label="Количество" defaultValue={5} {...props}>
      <NumberField.Group>{stepper()}</NumberField.Group>
    </NumberField>,
  );

describe("NumberField", () => {
  it("рендерит поле со значением", () => {
    renderField();

    expect(screen.getByRole("textbox", {name: "Количество"})).toHaveValue("5");
  });

  it("части несут свои data-slot", () => {
    renderField();

    expect(document.querySelector('[data-slot="number-field"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="number-field-group"]')).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="number-field-increment-button"]'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="number-field-decrement-button"]'),
    ).toBeInTheDocument();
  });

  it("кнопка приращения увеличивает значение", async () => {
    const onChange = vi.fn();

    renderField({onChange});
    const increment = document.querySelector(
      '[data-slot="number-field-increment-button"]',
    ) as HTMLElement;

    await press(increment);

    expect(screen.getByRole("textbox")).toHaveValue("6");
    expect(onChange).toHaveBeenCalled();
  });

  it("кнопка уменьшения снижает значение", async () => {
    renderField();
    const decrement = document.querySelector(
      '[data-slot="number-field-decrement-button"]',
    ) as HTMLElement;

    await press(decrement);

    expect(screen.getByRole("textbox")).toHaveValue("4");
  });

  it("уважает minValue", async () => {
    renderField({defaultValue: 1, minValue: 1});
    const decrement = document.querySelector(
      '[data-slot="number-field-decrement-button"]',
    ) as HTMLElement;

    await press(decrement);

    expect(screen.getByRole("textbox")).toHaveValue("1");
  });

  it("вводит значение с клавиатуры стрелкой вверх", async () => {
    const user = setupUser();

    renderField();
    const input = screen.getByRole("textbox", {name: "Количество"});

    input.focus();
    await user.keyboard("{ArrowUp}");

    expect(input).toHaveValue("6");
  });

  it("ведёт себя одинаково как NumberField.Root и NumberFieldRoot", () => {
    render(
      <>
        <NumberField.Root aria-label="Имена" defaultValue={1}>
          <NumberField.Group>{stepper()}</NumberField.Group>
        </NumberField.Root>
        <NumberFieldRoot aria-label="Плоский" defaultValue={2}>
          <NumberField.Group>{stepper()}</NumberField.Group>
        </NumberFieldRoot>
      </>,
    );

    expect(screen.getByLabelText("Имена")).toHaveValue("1");
    expect(screen.getByLabelText("Плоский")).toHaveValue("2");
  });
});
