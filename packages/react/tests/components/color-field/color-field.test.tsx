import {render, screen, setupUser} from "@peakui/testing/helpers";
import {Input, Label} from "react-aria-components";

import {ColorField, ColorFieldRoot} from "@/components/color-field/index.ts";

describe("ColorField", () => {
  it("exposes the BEM block and data-slot", () => {
    render(
      <ColorField aria-label="Hex" data-testid="field">
        <Input />
      </ColorField>,
    );

    expect(screen.getByTestId("field")).toHaveClass("color-field");
    expect(screen.getByTestId("field")).toHaveAttribute("data-slot", "color-field");
  });

  it("adds the full-width modifier on request", () => {
    render(
      <ColorField fullWidth aria-label="Hex" data-testid="field">
        <Input />
      </ColorField>,
    );

    expect(screen.getByTestId("field")).toHaveClass("color-field--full-width");
  });

  it("labels the input and shows the value as hex", () => {
    render(
      <ColorField defaultValue="#ff5733">
        <Label>Colour</Label>
        <Input />
      </ColorField>,
    );

    expect(screen.getByRole("textbox", {name: "Colour"})).toHaveValue("#FF5733");
  });

  it("commits a typed value on blur", async () => {
    const user = setupUser();
    const onChange = vi.fn();

    render(
      <ColorField aria-label="Hex" defaultValue="#ff0000" onChange={onChange}>
        <Input />
      </ColorField>,
    );

    const input = screen.getByRole("textbox", {name: "Hex"});

    await user.clear(input);
    await user.type(input, "#00ff00");
    await user.tab();

    expect(onChange).toHaveBeenCalled();
    expect(input).toHaveValue("#00FF00");
  });

  it("behaves identically as ColorField.Root and ColorFieldRoot", () => {
    expect(ColorField.Root).toBe(ColorFieldRoot);
    expect(ColorField).toBe(ColorFieldRoot);
  });
});
