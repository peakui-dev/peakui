import {render, screen} from "@peakui/testing/helpers";

import {ProgressCircle, ProgressCircleRoot} from "@/components/progress-circle/index.ts";

/* The reference geometry: centre 18, stroke 4, so the radius is 16. */
const CIRCUMFERENCE = 2 * Math.PI * 16;

const Circle = (props: Partial<React.ComponentProps<typeof ProgressCircle>>) => (
  <ProgressCircle aria-label="Loading" {...props}>
    <ProgressCircle.Track>
      <ProgressCircle.TrackCircle />
      {/* testid: the arc has no role, name or text */}
      <ProgressCircle.FillCircle data-testid="fill" />
    </ProgressCircle.Track>
  </ProgressCircle>
);

const dashOffset = () => Number(screen.getByTestId("fill").getAttribute("stroke-dashoffset"));

describe("ProgressCircle", () => {
  it("exposes the value to assistive technology under its name", () => {
    render(<Circle value={40} />);

    const circle = screen.getByRole("progressbar", {name: "Loading"});

    expect(circle).toHaveAttribute("aria-valuenow", "40");
    expect(circle).toHaveAttribute("data-slot", "progress-circle");
  });

  it.each([0, 50, 100])("sets the dash offset for %i%% of the circumference", (value) => {
    render(<Circle value={value} />);

    expect(dashOffset()).toBeCloseTo(CIRCUMFERENCE * (1 - value / 100), 4);
  });

  it("clamps a value above the maximum to a full arc", () => {
    render(<Circle value={140} />);

    expect(dashOffset()).toBeCloseTo(0, 4);
  });

  it("has no aria-valuenow when indeterminate, and its arc ignores the value", () => {
    render(<Circle isIndeterminate value={80} />);

    expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
    expect(dashOffset()).toBeCloseTo(CIRCUMFERENCE * 0.75, 4);
  });

  it("draws the track as an svg with the reference viewBox", () => {
    render(<Circle value={40} />);

    const svg = screen.getByRole("progressbar").querySelector("svg");

    expect(svg).toHaveAttribute("viewBox", "0 0 36 36");
    expect(svg).toHaveAttribute("data-slot", "progress-circle-track");
  });

  it.each(["default", "accent", "success", "warning", "danger"] as const)(
    "color %s adds its modifier",
    (color) => {
      render(<Circle color={color} value={60} />);

      expect(screen.getByRole("progressbar").className).toContain(`progress-circle--${color}`);
    },
  );

  it.each(["sm", "md", "lg"] as const)("size %s adds its modifier", (size) => {
    render(<Circle size={size} value={60} />);

    expect(screen.getByRole("progressbar").className).toContain(`progress-circle--${size}`);
  });

  it("falls back to accent and md", () => {
    render(<Circle value={60} />);

    const circle = screen.getByRole("progressbar");

    expect(circle.className).toContain("progress-circle--accent");
    expect(circle.className).toContain("progress-circle--md");
  });

  it("marks the circles with their data-slot", () => {
    render(<Circle value={60} />);

    const circle = screen.getByRole("progressbar");

    expect(circle.querySelector('[data-slot="progress-circle-track-circle"]')).not.toBeNull();
    expect(screen.getByTestId("fill")).toHaveAttribute("data-slot", "progress-circle-fill-circle");
  });

  it("lets a consumer override an svg attribute on a part", () => {
    render(
      <ProgressCircle aria-label="Loading" value={60}>
        <ProgressCircle.Track>
          {/* testid: the circle has no role, name or text */}
          <ProgressCircle.TrackCircle data-testid="track-circle" strokeWidth={2} />
        </ProgressCircle.Track>
      </ProgressCircle>,
    );

    expect(screen.getByTestId("track-circle")).toHaveAttribute("stroke-width", "2");
  });

  it("merges a consumer className with the block classes", () => {
    render(<Circle className="custom" value={60} />);

    const circle = screen.getByRole("progressbar");

    expect(circle.className).toContain("custom");
    expect(circle.className).toContain("progress-circle");
  });

  it("behaves identically as ProgressCircle.Root and ProgressCircleRoot", () => {
    render(
      <>
        <ProgressCircle.Root aria-label="Namespaced" value={10} />
        <ProgressCircleRoot aria-label="Flat" value={10} />
      </>,
    );

    for (const name of ["Namespaced", "Flat"]) {
      expect(screen.getByRole("progressbar", {name})).toHaveAttribute(
        "data-slot",
        "progress-circle",
      );
    }
  });
});

describe("ProgressCircle SVG overrides", () => {
  it("keeps the arc's dash geometry for the default circle when only strokeWidth changes", () => {
    render(
      <ProgressCircle aria-label="Loading" value={50}>
        <ProgressCircle.Track>
          <ProgressCircle.TrackCircle strokeWidth={2} />
          {/* testid: the arc has no role, name or text */}
          <ProgressCircle.FillCircle data-testid="fill" strokeWidth={2} />
        </ProgressCircle.Track>
      </ProgressCircle>,
    );

    const fill = screen.getByTestId("fill");

    expect(fill).toHaveAttribute("stroke-width", "2");
    expect(Number(fill.getAttribute("stroke-dasharray"))).toBeCloseTo(CIRCUMFERENCE, 4);
    expect(fill).toHaveAttribute("transform", "rotate(-90 18 18)");
    expect(fill).toHaveAttribute("r", "16");
  });
});
