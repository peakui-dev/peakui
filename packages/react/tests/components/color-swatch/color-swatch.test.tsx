import {render, screen} from "@peakui/testing/helpers";
import {parseColor} from "react-aria-components";

import {ColorSwatch, ColorSwatchRoot} from "@/components/color-swatch/index.ts";

/*
 * RAC's useColorSwatch composes the accessible name as [colorName | colour description,
 * aria-label].join(', ') — role "img" with the consumer's label appended, never replaced — so an
 * exact aria-label match is not a contract this component can offer. The suite queries the
 * reference's own way: by role, with colorName where an exact name matters.
 */
/*
 * RAC 1.21.1's Color.toString("css") always spells the alpha channel: parseColor("#00ff00")
 * serialises as "rgba(0, 255, 0, 1)", never "rgb(0, 255, 0)".
 */
describe("ColorSwatch", () => {
  it("publishes the colour as a custom property", () => {
    render(<ColorSwatch aria-label="Green" color={parseColor("#00ff00")} data-testid="swatch" />);

    expect(screen.getByTestId("swatch").style.getPropertyValue("--color-swatch-current")).toBe(
      "rgba(0, 255, 0, 1)",
    );
    expect(screen.getByTestId("swatch")).toHaveAttribute("data-slot", "color-swatch");
    expect(screen.getByTestId("swatch").getAttribute("aria-label")).toContain("Green");
  });

  it("keeps a consumer's style beside the custom property, functional style included", () => {
    render(
      <ColorSwatch
        aria-label="Green"
        color={parseColor("#00ff00")}
        data-testid="swatch"
        style={({color}) => ({borderColor: color.toString("hex")})}
      />,
    );

    expect(screen.getByTestId("swatch").style.getPropertyValue("--color-swatch-current")).toBe(
      "rgba(0, 255, 0, 1)",
    );
    expect(screen.getByTestId("swatch").style.borderColor).not.toBe("");
  });

  it("carries the shape and size variants as classes", () => {
    render(<ColorSwatch color={parseColor("#00ff00")} shape="square" size="lg" />);

    const swatch = screen.getByRole("img");

    expect(swatch.className).toContain("color-swatch--square");
    expect(swatch.className).toContain("color-swatch--lg");
  });

  it("supports a custom accessible name via colorName", () => {
    render(<ColorSwatch color={parseColor("#0485F7")} colorName="Brand blue" />);

    expect(screen.getByRole("img", {name: "Brand blue"})).toBeInTheDocument();
  });

  it("merges a consumer className with the block", () => {
    render(<ColorSwatch className="custom" color={parseColor("#00ff00")} />);

    expect(screen.getByRole("img").className).toContain("custom");
    expect(screen.getByRole("img").className).toContain("color-swatch");
  });

  it("behaves identically as ColorSwatch.Root and ColorSwatchRoot", () => {
    render(
      <>
        <ColorSwatch.Root color={parseColor("#00ff00")} colorName="First" />
        <ColorSwatchRoot color={parseColor("#00ff00")} colorName="Second" />
      </>,
    );

    const swatches = screen.getAllByRole("img");

    expect(swatches).toHaveLength(2);
    expect(swatches[0]!.getAttribute("aria-label")).toBe("First");
    expect(swatches[1]!.getAttribute("aria-label")).toBe("Second");
  });
});
