import type {ComponentProps} from "react";

import {render, screen, setupUser} from "@peakui/testing/helpers";

import {ColorSwatchPicker, ColorSwatchPickerRoot} from "@/components/color-swatch-picker/index.ts";

const COLORS = ["#ef4444", "#10b981", "#0485f7"];

function Picker(props: Partial<ComponentProps<typeof ColorSwatchPicker>> = {}) {
  return (
    <ColorSwatchPicker aria-label="Palette" defaultValue={COLORS[0]} {...props}>
      {COLORS.map((color) => (
        <ColorSwatchPicker.Item key={color} color={color}>
          <ColorSwatchPicker.Swatch />
          <ColorSwatchPicker.Indicator />
        </ColorSwatchPicker.Item>
      ))}
    </ColorSwatchPicker>
  );
}

describe("ColorSwatchPicker", () => {
  it("exposes the BEM block and data-slot on every part", () => {
    const {container} = render(<Picker />);

    const list = screen.getByRole("listbox", {name: "Palette"});
    const [first] = screen.getAllByRole("option");

    expect(list).toHaveClass("color-swatch-picker");
    expect(list).toHaveAttribute("data-slot", "color-swatch-picker");
    expect(first).toHaveClass("color-swatch-picker__item");
    expect(first).toHaveAttribute("data-slot", "color-swatch-picker-item");
    expect(container.querySelector('[data-slot="color-swatch-picker-swatch"]')).toHaveClass(
      "color-swatch-picker__swatch",
    );
    expect(container.querySelector('[data-slot="color-swatch-picker-indicator"]')).toHaveClass(
      "color-swatch-picker__indicator",
    );
  });

  it("defaults to the grid layout, the md size and the circle shape", () => {
    render(<Picker />);

    expect(screen.getByRole("listbox")).toHaveClass(
      "color-swatch-picker--grid",
      "color-swatch-picker--md",
      "color-swatch-picker--circle",
    );
  });

  it("applies the layout, size and shape modifiers", () => {
    render(<Picker layout="stack" size="xs" variant="square" />);

    expect(screen.getByRole("listbox")).toHaveClass(
      "color-swatch-picker--stack",
      "color-swatch-picker--xs",
      "color-swatch-picker--square",
    );
  });

  it("marks the item of the current value as selected", () => {
    render(<Picker />);

    const [first, second] = screen.getAllByRole("option");

    expect(first).toHaveAttribute("aria-selected", "true");
    expect(second).toHaveAttribute("aria-selected", "false");
  });

  it("selects an item on click and reports the colour", async () => {
    const user = setupUser();
    const onChange = vi.fn();

    render(<Picker onChange={onChange} />);

    const second = screen.getAllByRole("option")[1] as HTMLElement;

    await user.click(second);

    expect(second).toHaveAttribute("aria-selected", "true");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0].toString("hex")).toBe("#10B981");
  });

  it("hands the item colour to its styles as a custom property", () => {
    render(<Picker />);

    const first = screen.getAllByRole("option")[0] as HTMLElement;

    expect(first.style.getPropertyValue("--color-swatch-current")).not.toBe("");
  });

  it("marks the indicator of a light colour for a dark check", () => {
    render(
      <ColorSwatchPicker aria-label="Palette" defaultValue="#ffffff">
        <ColorSwatchPicker.Item color="#ffffff">
          <ColorSwatchPicker.Indicator data-testid="indicator" />
        </ColorSwatchPicker.Item>
      </ColorSwatchPicker>,
    );

    expect(screen.getByTestId("indicator")).toHaveAttribute("data-light-color", "true");
  });

  it("behaves identically as ColorSwatchPicker.Root and ColorSwatchPickerRoot", () => {
    expect(ColorSwatchPicker.Root).toBe(ColorSwatchPickerRoot);
    expect(ColorSwatchPicker).toBe(ColorSwatchPickerRoot);
  });
});
