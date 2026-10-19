import {render, screen} from "@peakui/testing/helpers";

import {Label} from "@/components/label/index.ts";
import {Meter, MeterRoot} from "@/components/meter/index.ts";

describe("Meter", () => {
  it("exposes the value to assistive technology under its name", () => {
    render(
      <Meter aria-label="Storage" value={40}>
        <Meter.Track>
          <Meter.Fill />
        </Meter.Track>
      </Meter>,
    );

    const meter = screen.getByRole("meter", {name: "Storage"});

    expect(meter).toHaveAttribute("aria-valuenow", "40");
    expect(meter).toHaveAttribute("data-slot", "meter");
  });

  it("is named by a visible label rather than aria-label", () => {
    render(
      <Meter value={40}>
        <Label>Storage</Label>
        <Meter.Track>
          <Meter.Fill />
        </Meter.Track>
      </Meter>,
    );

    expect(screen.getByRole("meter", {name: "Storage"})).toHaveAttribute("aria-valuenow", "40");
  });

  it("derives the fill width from the value in the given range", () => {
    render(
      <Meter aria-label="Steps" maxValue={8} minValue={0} value={2}>
        <Meter.Track>
          {/* testid: Fill has no role, name or text */}
          <Meter.Fill data-testid="fill" />
        </Meter.Track>
      </Meter>,
    );

    expect(screen.getByTestId("fill").style.width).toBe("25%");
  });

  it("derives the fill width from a non-zero minimum", () => {
    render(
      <Meter aria-label="Range" maxValue={50} minValue={10} value={30}>
        <Meter.Track>
          {/* testid: Fill has no role, name or text */}
          <Meter.Fill data-testid="fill" />
        </Meter.Track>
      </Meter>,
    );

    expect(screen.getByTestId("fill").style.width).toBe("50%");
  });

  it("clamps a value above the maximum to a full fill", () => {
    render(
      <Meter aria-label="Over" value={140}>
        <Meter.Track>
          {/* testid: Fill has no role, name or text */}
          <Meter.Fill data-testid="fill" />
        </Meter.Track>
      </Meter>,
    );

    expect(screen.getByTestId("fill").style.width).toBe("100%");
  });

  it("clamps a value below the minimum to an empty fill", () => {
    render(
      <Meter aria-label="Under" minValue={10} value={-5}>
        <Meter.Track>
          {/* testid: Fill has no role, name or text */}
          <Meter.Fill data-testid="fill" />
        </Meter.Track>
      </Meter>,
    );

    expect(screen.getByTestId("fill").style.width).toBe("0%");
  });

  it("shows the formatted value in the output, or the children it is given", () => {
    const {rerender} = render(
      <Meter aria-label="Storage" value={40}>
        {/* testid: Output has no role or name, and its text is under test */}
        <Meter.Output data-testid="out" />
      </Meter>,
    );

    expect(screen.getByTestId("out")).toHaveTextContent("40%");
    rerender(
      <Meter aria-label="Storage" value={40}>
        {/* testid: the same Output after the rerender */}
        <Meter.Output data-testid="out">2 of 5</Meter.Output>
      </Meter>,
    );
    expect(screen.getByTestId("out")).toHaveTextContent("2 of 5");
  });

  it.each(["default", "accent", "success", "warning", "danger"] as const)(
    "color %s adds its modifier",
    (color) => {
      render(<Meter aria-label="Disk" color={color} value={90} />);

      expect(screen.getByRole("meter").className).toContain(`meter--${color}`);
    },
  );

  it.each(["sm", "md", "lg"] as const)("size %s adds its modifier", (size) => {
    render(<Meter aria-label="Disk" size={size} value={90} />);

    expect(screen.getByRole("meter").className).toContain(`meter--${size}`);
  });

  it("falls back to accent and md", () => {
    render(<Meter aria-label="Disk" value={90} />);

    const meter = screen.getByRole("meter");

    expect(meter.className).toContain("meter--accent");
    expect(meter.className).toContain("meter--md");
  });

  it("marks every part with its data-slot", () => {
    render(
      <Meter aria-label="Parts" value={40}>
        {/* testid: parts have no role or name, and data-slot is under test */}
        <Meter.Output data-testid="output" />
        <Meter.Track data-testid="track">
          <Meter.Fill data-testid="fill" />
        </Meter.Track>
      </Meter>,
    );

    expect(screen.getByTestId("output")).toHaveAttribute("data-slot", "meter-output");
    expect(screen.getByTestId("track")).toHaveAttribute("data-slot", "meter-track");
    expect(screen.getByTestId("fill")).toHaveAttribute("data-slot", "meter-fill");
  });

  it("merges a consumer className with the block classes", () => {
    render(<Meter aria-label="Merged" className="custom" value={10} />);

    const meter = screen.getByRole("meter");

    expect(meter.className).toContain("custom");
    expect(meter.className).toContain("meter");
  });

  it("behaves identically as Meter.Root and MeterRoot", () => {
    render(
      <>
        <Meter.Root aria-label="Namespaced" value={10} />
        <MeterRoot aria-label="Flat" value={10} />
      </>,
    );

    for (const name of ["Namespaced", "Flat"]) {
      expect(screen.getByRole("meter", {name})).toHaveAttribute("data-slot", "meter");
    }
  });
});
