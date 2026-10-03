import {render, screen} from "@peakui/testing/helpers";
import {createRef} from "react";

import {FieldError, FieldErrorRoot} from "@/components/field-error/index.ts";
import {Input} from "@/components/input/index.ts";
import {Label} from "@/components/label/index.ts";
import {TextField} from "@/components/textfield/index.ts";

const field = (node: React.ReactNode, {isInvalid = false} = {}) => (
  <TextField isInvalid={isInvalid}>
    <Label>City</Label>
    <Input />
    {node}
  </TextField>
);

describe("FieldError", () => {
  it("shows the message when the field is invalid", () => {
    render(field(<FieldError>City is required</FieldError>, {isInvalid: true}));

    expect(screen.getByText("City is required")).toBeInTheDocument();
  });

  it("renders nothing when the field is valid", () => {
    render(field(<FieldError>City is required</FieldError>));

    expect(screen.queryByText("City is required")).not.toBeInTheDocument();
  });

  it("describes the control while invalid", () => {
    render(field(<FieldError>City is required</FieldError>, {isInvalid: true}));

    expect(screen.getByRole("textbox")).toHaveAccessibleDescription("City is required");
  });

  it("exposes BEM block, data-slot and data-visible", () => {
    render(field(<FieldError>City is required</FieldError>, {isInvalid: true}));
    const error = screen.getByText("City is required");

    expect(error.className).toEqual(expect.stringContaining("field-error"));
    expect(error).toHaveAttribute("data-slot", "field-error");
    expect(error).toHaveAttribute("data-visible");
  });

  it("forwards ref to the rendered element", () => {
    const ref = createRef<HTMLElement>();

    render(field(<FieldError ref={ref}>City is required</FieldError>, {isInvalid: true}));

    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it("behaves identically as FieldError.Root and FieldErrorRoot", () => {
    render(
      <>
        {field(<FieldError.Root>Namespaced</FieldError.Root>, {isInvalid: true})}
        {field(<FieldErrorRoot>Flat</FieldErrorRoot>, {isInvalid: true})}
      </>,
    );

    for (const text of ["Namespaced", "Flat"]) {
      expect(screen.getByText(text)).toHaveAttribute("data-slot", "field-error");
    }
  });
});
