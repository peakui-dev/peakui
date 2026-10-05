import type {ComponentProps} from "react";

import {fireEvent, render, screen} from "@peakui/testing/helpers";

import {Checkbox} from "@/components/checkbox/index.ts";
import {CheckboxGroup} from "@/components/checkbox-group/index.ts";
import {Label} from "@/components/label/index.ts";

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
  <Checkbox value={value}>
    <Checkbox.Content>
      <Checkbox.Control>
        <Checkbox.Indicator />
      </Checkbox.Control>
      <Label>{label}</Label>
    </Checkbox.Content>
  </Checkbox>
);

const renderGroup = (props: ComponentProps<typeof CheckboxGroup> = {}) =>
  render(
    <CheckboxGroup {...props}>
      <Label>Каналы</Label>
      {option("email", "Почта")}
      {option("sms", "СМС")}
    </CheckboxGroup>,
  );

describe("CheckboxGroup", () => {
  it("рендерит group с доступным именем из Label", () => {
    renderGroup();

    expect(screen.getByRole("group", {name: "Каналы"})).toBeInTheDocument();
  });

  it("несёт data-slot и модификатор варианта", () => {
    renderGroup({variant: "secondary"});

    expect(screen.getByRole("group").getAttribute("data-slot")).toBe("checkbox-group");
    expect(screen.getByRole("group")).toHaveClass("checkbox-group--secondary");
  });

  it("выбирает значения по нажатию и сообщает их onChange", async () => {
    const onChange = vi.fn();

    renderGroup({onChange});

    await press(screen.getByRole("checkbox", {name: "Почта"}));

    expect(onChange).toHaveBeenCalledWith(["email"]);

    await press(screen.getByRole("checkbox", {name: "СМС"}));

    expect(onChange).toHaveBeenLastCalledWith(["email", "sms"]);
  });

  it("учитывает defaultSelectedKeys", () => {
    renderGroup({defaultValue: ["sms"]});

    expect(screen.getByRole("checkbox", {name: "Почта"})).not.toBeChecked();
    expect(screen.getByRole("checkbox", {name: "СМС"})).toBeChecked();
  });

  it("isDisabled на группе блокирует дочерние чекбоксы", async () => {
    const onChange = vi.fn();

    renderGroup({isDisabled: true, onChange});
    const checkbox = screen.getByRole("checkbox", {name: "Почта"});

    expect(checkbox).toBeDisabled();

    await press(checkbox);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("передаёт состояние группы в render-prop children", () => {
    render(
      <CheckboxGroup isDisabled>
        {({isDisabled}) => <output>{isDisabled ? "заблокирована" : "активна"}</output>}
      </CheckboxGroup>,
    );

    expect(screen.getByText("заблокирована")).toBeInTheDocument();
  });
});
