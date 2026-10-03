import {render, screen, setupUser} from "@peakui/testing/helpers";
import {createRef} from "react";

import {Input, InputRoot} from "@/components/input/index.ts";
import {FieldVariantContext} from "@/contexts/field-variant.ts";

describe("Input", () => {
  let user: ReturnType<typeof setupUser>;

  beforeAll(() => {
    user = setupUser();
  });

  it("renders a textbox and accepts typing", async () => {
    render(<Input aria-label="City" />);
    const input = screen.getByRole("textbox", {name: "City"});

    await user.type(input, "Vienna");

    expect(input).toHaveValue("Vienna");
  });

  it("exposes BEM block and data-slot", () => {
    render(<Input aria-label="City" />);
    const input = screen.getByRole("textbox", {name: "City"});

    expect(input.className).toEqual(expect.stringContaining("input"));
    expect(input).toHaveAttribute("data-slot", "input");
  });

  it("applies the full-width modifier", () => {
    render(<Input fullWidth aria-label="City" />);

    expect(screen.getByRole("textbox", {name: "City"}).className).toEqual(
      expect.stringContaining("input--full-width"),
    );
  });

  it("defaults to the primary variant with no field root above it", () => {
    render(<Input aria-label="City" />);

    expect(screen.getByRole("textbox", {name: "City"}).className).toEqual(
      expect.stringContaining("input--primary"),
    );
  });

  it("reads the variant from the field context", () => {
    render(
      <FieldVariantContext value={{variant: "secondary"}}>
        <Input aria-label="City" />
      </FieldVariantContext>,
    );

    expect(screen.getByRole("textbox", {name: "City"}).className).toEqual(
      expect.stringContaining("input--secondary"),
    );
  });

  it("lets an explicit variant prop win over the context", () => {
    render(
      <FieldVariantContext value={{variant: "secondary"}}>
        <Input aria-label="City" variant="primary" />
      </FieldVariantContext>,
    );

    expect(screen.getByRole("textbox", {name: "City"}).className).toEqual(
      expect.stringContaining("input--primary"),
    );
  });

  it("merges a consumer className with the BEM names", () => {
    render(<Input aria-label="City" className="mine" />);
    const {className} = screen.getByRole("textbox", {name: "City"});

    expect(className).toEqual(expect.stringContaining("input"));
    expect(className).toEqual(expect.stringContaining("mine"));
  });

  it("does not fire onChange while disabled", async () => {
    const onChange = vi.fn();

    render(<Input disabled aria-label="City" onChange={onChange} />);

    await user.type(screen.getByRole("textbox", {name: "City"}), "Vienna");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("forwards ref to the input element", () => {
    const ref = createRef<HTMLInputElement>();

    render(<Input ref={ref} aria-label="City" />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("behaves identically as Input.Root and InputRoot", () => {
    render(
      <>
        <Input.Root aria-label="Namespaced" />
        <InputRoot aria-label="Flat" />
      </>,
    );

    for (const name of ["Namespaced", "Flat"]) {
      expect(screen.getByRole("textbox", {name})).toHaveAttribute("data-slot", "input");
    }
  });
});
