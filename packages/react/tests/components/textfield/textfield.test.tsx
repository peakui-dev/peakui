import {render, screen} from "@peakui/testing/helpers";
import {createRef} from "react";

import {Input} from "@/components/input/index.ts";
import {Label} from "@/components/label/index.ts";
import {TextField, TextFieldRoot} from "@/components/textfield/index.ts";
import {FieldVariantContext} from "@/contexts/field-variant.ts";

describe("TextField", () => {
  it("binds the label to the control", () => {
    render(
      <TextField>
        <Label>City</Label>
        <Input />
      </TextField>,
    );

    expect(screen.getByLabelText("City")).toBe(screen.getByRole("textbox"));
  });

  it("exposes BEM block and data-slot", () => {
    render(
      <TextField>
        <Label>City</Label>
        <Input />
      </TextField>,
    );
    const root = screen.getByRole("textbox").closest('[data-slot="textfield"]');

    expect(root).not.toBeNull();
    expect(root?.className).toEqual(expect.stringContaining("textfield"));
  });

  it("applies the full-width modifier", () => {
    render(
      <TextField fullWidth>
        <Label>City</Label>
        <Input />
      </TextField>,
    );

    expect(screen.getByRole("textbox").closest('[data-slot="textfield"]')?.className).toEqual(
      expect.stringContaining("textfield--full-width"),
    );
  });

  it("passes its variant to a child Input through context", () => {
    render(
      <TextField variant="secondary">
        <Label>City</Label>
        <Input />
      </TextField>,
    );

    expect(screen.getByRole("textbox").className).toEqual(
      expect.stringContaining("input--secondary"),
    );
  });

  it("provides the context even without a variant, resetting an outer one", () => {
    render(
      <FieldVariantContext value={{variant: "secondary"}}>
        <TextField>
          <Label>City</Label>
          <Input />
        </TextField>
      </FieldVariantContext>,
    );

    expect(screen.getByRole("textbox").className).toEqual(
      expect.stringContaining("input--primary"),
    );
  });

  it("marks the field invalid", () => {
    render(
      <TextField isInvalid>
        <Label>City</Label>
        <Input />
      </TextField>,
    );

    expect(screen.getByRole("textbox").closest('[data-slot="textfield"]')).toHaveAttribute(
      "data-invalid",
    );
  });

  it("marks the field required", () => {
    render(
      <TextField isRequired>
        <Label>City</Label>
        <Input />
      </TextField>,
    );

    expect(screen.getByRole("textbox").closest('[data-slot="textfield"]')).toHaveAttribute(
      "data-required",
    );
  });

  it("forwards ref to the root element", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <TextField ref={ref}>
        <Label>City</Label>
        <Input />
      </TextField>,
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("behaves identically as TextField.Root and TextFieldRoot", () => {
    render(
      <>
        <TextField.Root>
          <Label>Namespaced</Label>
          <Input />
        </TextField.Root>
        <TextFieldRoot>
          <Label>Flat</Label>
          <Input />
        </TextFieldRoot>
      </>,
    );

    for (const name of ["Namespaced", "Flat"]) {
      expect(screen.getByLabelText(name).closest('[data-slot="textfield"]')).not.toBeNull();
    }
  });
});
