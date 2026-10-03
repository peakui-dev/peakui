import {render, screen} from "@peakui/testing/helpers";
import {createRef} from "react";

import {Description, DescriptionRoot} from "@/components/description/index.ts";
import {Input} from "@/components/input/index.ts";
import {Label} from "@/components/label/index.ts";
import {TextField} from "@/components/textfield/index.ts";
import {FieldSlotsGateContext} from "@/hooks/use-has-text-slot.ts";

const field = (node: React.ReactNode) => (
  <TextField>
    <Label>City</Label>
    <Input />
    {node}
  </TextField>
);

describe("Description", () => {
  it("describes the control it sits beside", () => {
    render(field(<Description>Where you live</Description>));

    expect(screen.getByRole("textbox")).toHaveAccessibleDescription("Where you live");
  });

  it("exposes BEM block and data-slot", () => {
    render(field(<Description>Where you live</Description>));
    const description = screen.getByText("Where you live");

    expect(description.className).toEqual(expect.stringContaining("description"));
    expect(description).toHaveAttribute("data-slot", "description");
  });

  it("renders nothing inside a gate with no description slot", () => {
    render(
      <FieldSlotsGateContext value>
        <Description>Where you live</Description>
      </FieldSlotsGateContext>,
    );

    expect(screen.queryByText("Where you live")).not.toBeInTheDocument();
  });

  it("forwards ref to the rendered element", () => {
    const ref = createRef<HTMLElement>();

    render(field(<Description ref={ref}>Where you live</Description>));

    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it("behaves identically as Description.Root and DescriptionRoot", () => {
    render(
      <>
        {field(<Description.Root>Namespaced</Description.Root>)}
        {field(<DescriptionRoot>Flat</DescriptionRoot>)}
      </>,
    );

    for (const text of ["Namespaced", "Flat"]) {
      expect(screen.getByText(text)).toHaveAttribute("data-slot", "description");
    }
  });
});
