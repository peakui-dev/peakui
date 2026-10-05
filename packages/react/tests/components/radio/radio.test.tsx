import type {ComponentProps} from "react";

import {fireEvent, render, screen, setupUser} from "@peakui/testing/helpers";

import {Label} from "@/components/label/index.ts";
import {Radio, RadioRoot} from "@/components/radio/index.ts";
import {RadioGroup} from "@/components/radio-group/index.ts";

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

const renderOption = (props: ComponentProps<typeof Radio> = {value: "a"}, text = "Опция") =>
  render(
    <RadioGroup aria-label="Группа">
      <Radio {...props}>
        <Radio.Content>
          <Radio.Control>
            <Radio.Indicator />
          </Radio.Control>
          <Label>{text}</Label>
        </Radio.Content>
      </Radio>
    </RadioGroup>,
  );

describe("Radio", () => {
  it("рендерит radio с доступным именем из Label", () => {
    renderOption();

    expect(screen.getByRole("radio", {name: "Опция"})).toBeInTheDocument();
  });

  it("по нажатию выбирает радиокнопку", async () => {
    renderOption();
    const radio = screen.getByRole("radio", {name: "Опция"});

    await press(radio);

    expect(radio).toBeChecked();
    expect(document.querySelector('[data-slot="radio-content"]')).toHaveAttribute(
      "data-selected",
      "true",
    );
  });

  it("Content — это label с data-slot, Control и Indicator — свои слоты", () => {
    renderOption();
    const content = document.querySelector('[data-slot="radio-content"]');

    expect(content?.tagName).toBe("LABEL");
    expect(document.querySelector('[data-slot="radio-control"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="radio-indicator"]')).toBeInTheDocument();
  });

  it("заблокированная радиокнопка не реагирует", async () => {
    const user = setupUser();

    renderOption({value: "a", isDisabled: true});
    const radio = screen.getByRole("radio", {name: "Опция"});

    expect(radio).toBeDisabled();

    await user.click(radio);

    expect(radio).not.toBeChecked();
  });

  it("ведёт себя одинаково как Radio.Root и RadioRoot", () => {
    render(
      <RadioGroup aria-label="Группа">
        <Radio.Root aria-label="Имена" value="a">
          <Radio.Content>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
          </Radio.Content>
        </Radio.Root>
        <RadioRoot aria-label="Плоский" value="b">
          <Radio.Content>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
          </Radio.Content>
        </RadioRoot>
      </RadioGroup>,
    );

    expect(screen.getByRole("radio", {name: "Имена"})).toBeInTheDocument();
    expect(screen.getByRole("radio", {name: "Плоский"})).toBeInTheDocument();
  });

  it("передаёт состояние в render-prop children корня", () => {
    render(
      <RadioGroup aria-label="Группа" defaultValue="a">
        <Radio value="a">
          {(state) => (
            <Radio.Content>
              <Radio.Control>
                <Radio.Indicator>{state.isSelected ? "выбрано" : "пусто"}</Radio.Indicator>
              </Radio.Control>
              <Label>Опция</Label>
            </Radio.Content>
          )}
        </Radio>
      </RadioGroup>,
    );

    expect(screen.getByText("выбрано")).toBeInTheDocument();
  });
});
