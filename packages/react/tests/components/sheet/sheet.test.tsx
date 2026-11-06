import {render, screen} from "@peakui/testing/helpers";

import {Sheet, SheetRoot} from "@/components/sheet/index.ts";

describe("Sheet", () => {
  it("exposes BEM block and data-slot", () => {
    render(<Sheet>Content</Sheet>);
    const element = screen.getByText("Content");

    expect(element.className).toEqual(expect.stringContaining("sheet"));
    expect(element).toHaveAttribute("data-slot", "sheet");
  });

  it("merges a consumer className with the block", () => {
    render(<Sheet className="custom">Content</Sheet>);

    expect(screen.getByText("Content").className).toEqual(expect.stringContaining("custom"));
  });

  it("behaves identically as Sheet.Root and SheetRoot", () => {
    render(
      <>
        <Sheet.Root>Namespaced</Sheet.Root>
        <SheetRoot>Flat</SheetRoot>
      </>,
    );

    for (const name of ["Namespaced", "Flat"]) {
      expect(screen.getByText(name)).toHaveAttribute("data-slot", "sheet");
    }
  });
});
