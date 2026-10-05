import type {ComponentProps} from "react";

import {fireEvent, render, screen} from "@peakui/testing/helpers";

import {Label} from "@/components/label/index.ts";
import {Radio} from "@/components/radio/index.ts";
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

const option = (value: string, label: string) => (
  <Radio value={value}>
    <Radio.Content>
      <Radio.Control>
        <Radio.Indicator />
      </Radio.Control>
      <Label>{label}</Label>
    </Radio.Content>
  </Radio>
);

const renderGroup = (props: ComponentProps<typeof RadioGroup> = {}) =>
  render(
    <RadioGroup {...props}>
      <Label>Размер</Label>
      {option("sm", "Маленький")}
      {option("md", "Обычный")}
    </RadioGroup>,
  );

describe("RadioGroup", () => {
  it("рендерит radiogroup с доступным именем из Label", () => {
    renderGroup();

    expect(screen.getByRole("radiogroup", {name: "Размер"})).toBeInTheDocument();
  });

  it("несёт data-slot и модификатор варианта", () => {
    renderGroup({variant: "secondary"});

    expect(screen.getByRole("radiogroup").getAttribute("data-slot")).toBe("radio-group");
    expect(screen.getByRole("radiogroup")).toHaveClass("radio-group--secondary");
  });

  it("выбор взаимоисключающий и сообщает значение onChange", async () => {
    const onChange = vi.fn();

    renderGroup({onChange});

    await press(screen.getByRole("radio", {name: "Маленький"}));

    expect(onChange).toHaveBeenCalledWith("sm");

    await press(screen.getByRole("radio", {name: "Обычный"}));

    expect(onChange).toHaveBeenLastCalledWith("md");
    expect(screen.getByRole("radio", {name: "Маленький"})).not.toBeChecked();
    expect(screen.getByRole("radio", {name: "Обычный"})).toBeChecked();
  });

  it("учитывает defaultValue", () => {
    renderGroup({defaultValue: "md"});

    expect(screen.getByRole("radio", {name: "Маленький"})).not.toBeChecked();
    expect(screen.getByRole("radio", {name: "Обычный"})).toBeChecked();
  });

  it("isDisabled на группе блокирует дочерние радиокнопки", async () => {
    const onChange = vi.fn();

    renderGroup({isDisabled: true, onChange});
    const radio = screen.getByRole("radio", {name: "Маленький"});

    expect(radio).toBeDisabled();

    await press(radio);

    expect(onChange).not.toHaveBeenCalled();
    expect(radio).not.toBeChecked();
  });

  it("передаёт состояние группы в render-prop children", () => {
    render(
      <RadioGroup isDisabled>
        {({isDisabled}) => <output>{isDisabled ? "заблокирована" : "активна"}</output>}
      </RadioGroup>,
    );

    expect(screen.getByText("заблокирована")).toBeInTheDocument();
  });
});
