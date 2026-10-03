import {render, screen} from "@peakui/testing/helpers";
import {createRef} from "react";

import {Label, LabelRoot} from "@/components/label/index.ts";

describe("Label", () => {
  it("renders a label element with its text", () => {
    render(<Label>City</Label>);

    expect(screen.getByText("City").tagName).toBe("LABEL");
  });

  it("exposes BEM block and data-slot", () => {
    render(<Label>City</Label>);
    const label = screen.getByText("City");

    expect(label.className).toEqual(expect.stringContaining("label"));
    expect(label).toHaveAttribute("data-slot", "label");
  });

  it("applies the required modifier", () => {
    render(<Label isRequired>City</Label>);

    expect(screen.getByText("City").className).toEqual(expect.stringContaining("label--required"));
  });

  it("applies the disabled modifier", () => {
    render(<Label isDisabled>City</Label>);

    expect(screen.getByText("City").className).toEqual(expect.stringContaining("label--disabled"));
  });

  it("applies the invalid modifier", () => {
    render(<Label isInvalid>City</Label>);

    expect(screen.getByText("City").className).toEqual(expect.stringContaining("label--invalid"));
  });

  it("forwards ref to the label element", () => {
    const ref = createRef<HTMLLabelElement>();

    render(<Label ref={ref}>City</Label>);

    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it("behaves identically as Label.Root and LabelRoot", () => {
    render(
      <>
        <Label.Root>Namespaced</Label.Root>
        <LabelRoot>Flat</LabelRoot>
      </>,
    );

    for (const name of ["Namespaced", "Flat"]) {
      expect(screen.getByText(name)).toHaveAttribute("data-slot", "label");
    }
  });
});
