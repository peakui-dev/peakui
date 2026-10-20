import type {ComponentProps} from "react";

import {render, screen} from "@peakui/testing/helpers";

import {ColorField} from "@/components/color-field/index.ts";
import {ColorInputGroup, ColorInputGroupRoot} from "@/components/color-input-group/index.ts";
import {ColorSwatch} from "@/components/color-swatch/index.ts";

function Group(props: Partial<ComponentProps<typeof ColorInputGroup>> = {}) {
  return (
    <ColorField aria-label="Hex" defaultValue="#ff5733">
      <ColorInputGroup data-testid="group" {...props}>
        <ColorInputGroup.Prefix data-testid="prefix">
          <ColorSwatch aria-label="Current colour" size="xs" />
        </ColorInputGroup.Prefix>
        <ColorInputGroup.Input />
        <ColorInputGroup.Suffix data-testid="suffix">%</ColorInputGroup.Suffix>
      </ColorInputGroup>
    </ColorField>
  );
}

describe("ColorInputGroup", () => {
  it("exposes the BEM block and data-slot on every part", () => {
    render(<Group />);

    const input = screen.getByRole("textbox", {name: "Hex"});

    expect(screen.getByTestId("group")).toHaveClass("color-input-group");
    expect(screen.getByTestId("group")).toHaveAttribute("data-slot", "color-input-group");
    expect(screen.getByTestId("prefix")).toHaveClass("color-input-group__prefix");
    expect(screen.getByTestId("prefix")).toHaveAttribute("data-slot", "color-input-group-prefix");
    expect(screen.getByTestId("suffix")).toHaveClass("color-input-group__suffix");
    expect(screen.getByTestId("suffix")).toHaveAttribute("data-slot", "color-input-group-suffix");
    expect(input).toHaveClass("color-input-group__input");
    expect(input).toHaveAttribute("data-slot", "color-input-group-input");
  });

  it("takes its value from the surrounding ColorField", () => {
    render(<Group />);

    expect(screen.getByRole("textbox", {name: "Hex"})).toHaveValue("#FF5733");
  });

  it("applies the variant and width modifiers", () => {
    render(<Group fullWidth variant="secondary" />);

    expect(screen.getByTestId("group")).toHaveClass(
      "color-input-group--secondary",
      "color-input-group--full-width",
    );
  });

  it("defaults to the primary variant", () => {
    render(<Group />);

    expect(screen.getByTestId("group")).toHaveClass("color-input-group--primary");
  });

  it("merges a consumer className on a part with its BEM name", () => {
    render(
      <ColorField aria-label="Hex" defaultValue="#ff5733">
        <ColorInputGroup>
          <ColorInputGroup.Prefix className="custom" data-testid="prefix">
            #
          </ColorInputGroup.Prefix>
          <ColorInputGroup.Input />
        </ColorInputGroup>
      </ColorField>,
    );

    expect(screen.getByTestId("prefix")).toHaveClass("color-input-group__prefix", "custom");
  });

  it("behaves identically as ColorInputGroup.Root and ColorInputGroupRoot", () => {
    expect(ColorInputGroup.Root).toBe(ColorInputGroupRoot);
    expect(ColorInputGroup).toBe(ColorInputGroupRoot);
  });
});
