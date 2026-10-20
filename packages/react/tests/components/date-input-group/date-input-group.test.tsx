import type {ComponentProps} from "react";

import {CalendarDate} from "@internationalized/date";
import {render, screen} from "@peakui/testing/helpers";

import {DateField} from "@/components/date-field/index.ts";
import {DateInputGroup, DateInputGroupRoot} from "@/components/date-input-group/index.ts";

function Group(props: Partial<ComponentProps<typeof DateInputGroup>> = {}) {
  return (
    <DateField aria-label="Date" defaultValue={new CalendarDate(2026, 8, 15)}>
      <DateInputGroup data-testid="group" {...props}>
        <DateInputGroup.Prefix data-testid="prefix">from</DateInputGroup.Prefix>
        <DateInputGroup.InputContainer data-testid="container">
          <DateInputGroup.Input data-testid="input">
            {(segment) => <DateInputGroup.Segment segment={segment} />}
          </DateInputGroup.Input>
        </DateInputGroup.InputContainer>
        <DateInputGroup.Suffix data-testid="suffix">UTC</DateInputGroup.Suffix>
      </DateInputGroup>
    </DateField>
  );
}

describe("DateInputGroup", () => {
  it("exposes the BEM block and data-slot on every part", () => {
    render(<Group />);

    const parts = {
      container: ["date-input-group__input-container", "date-input-group-input-container"],
      group: ["date-input-group", "date-input-group"],
      input: ["date-input-group__input", "date-input-group-input"],
      prefix: ["date-input-group__prefix", "date-input-group-prefix"],
      suffix: ["date-input-group__suffix", "date-input-group-suffix"],
    } as const;

    for (const [id, [cls, slot]] of Object.entries(parts)) {
      expect(screen.getByTestId(id)).toHaveClass(cls);
      expect(screen.getByTestId(id)).toHaveAttribute("data-slot", slot);
    }

    const segment = screen.getByRole("spinbutton", {name: /month/i});

    expect(segment).toHaveClass("date-input-group__segment");
    expect(segment).toHaveAttribute("data-slot", "date-input-group-segment");
  });

  it("defaults to the primary variant", () => {
    render(<Group />);

    expect(screen.getByTestId("group")).toHaveClass("date-input-group--primary");
  });

  it("applies the variant and width modifiers", () => {
    render(<Group fullWidth variant="secondary" />);

    expect(screen.getByTestId("group")).toHaveClass(
      "date-input-group--secondary",
      "date-input-group--full-width",
    );
  });

  it("merges a consumer className on a part with its BEM name", () => {
    render(
      <DateField aria-label="Date">
        <DateInputGroup>
          <DateInputGroup.Prefix className="custom" data-testid="prefix">
            from
          </DateInputGroup.Prefix>
          <DateInputGroup.Input>
            {(segment) => <DateInputGroup.Segment className="custom-segment" segment={segment} />}
          </DateInputGroup.Input>
        </DateInputGroup>
      </DateField>,
    );

    expect(screen.getByTestId("prefix")).toHaveClass("date-input-group__prefix", "custom");
    expect(screen.getAllByRole("spinbutton")[0]).toHaveClass(
      "date-input-group__segment",
      "custom-segment",
    );
  });

  it("replaces the rendered element through the render prop", () => {
    render(
      <DateField aria-label="Date">
        <DateInputGroup>
          <DateInputGroup.Suffix data-testid="suffix" render={(props) => <span {...props} />}>
            UTC
          </DateInputGroup.Suffix>
          <DateInputGroup.Input>
            {(segment) => <DateInputGroup.Segment segment={segment} />}
          </DateInputGroup.Input>
        </DateInputGroup>
      </DateField>,
    );

    expect(screen.getByTestId("suffix").tagName).toBe("SPAN");
  });

  it("takes its value from the surrounding field", () => {
    render(<Group />);

    expect(screen.getByRole("spinbutton", {name: /year/i})).toHaveTextContent("2026");
  });

  it("behaves identically as DateInputGroup.Root and DateInputGroupRoot", () => {
    expect(DateInputGroup.Root).toBe(DateInputGroupRoot);
    expect(DateInputGroup).toBe(DateInputGroupRoot);
  });
});
