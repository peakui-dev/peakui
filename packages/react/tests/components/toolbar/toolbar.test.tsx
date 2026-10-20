import {render, screen, setupUser} from "@peakui/testing/helpers";
import {createRef} from "react";

import {Button} from "@/components/button/index.ts";
import {Separator} from "@/components/separator/index.ts";
import {ToggleButton} from "@/components/toggle-button/index.ts";
import {ToggleButtonGroup} from "@/components/toggle-button-group/index.ts";
import {Toolbar, ToolbarRoot} from "@/components/toolbar/index.ts";

describe("Toolbar", () => {
  let user: ReturnType<typeof setupUser>;

  beforeAll(() => {
    user = setupUser();
  });

  it("renders a toolbar with the BEM block and data-slot", () => {
    render(
      <Toolbar aria-label="Tools">
        <Button>One</Button>
      </Toolbar>,
    );
    const toolbar = screen.getByRole("toolbar", {name: "Tools"});

    expect(toolbar).toHaveAttribute("data-slot", "toolbar");
    expect(toolbar).toHaveClass("toolbar", "toolbar--horizontal");
    expect(toolbar).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("applies the vertical orientation", () => {
    render(
      <Toolbar aria-label="Tools" orientation="vertical">
        <Button>One</Button>
      </Toolbar>,
    );
    const toolbar = screen.getByRole("toolbar");

    expect(toolbar).toHaveClass("toolbar--vertical");
    expect(toolbar).toHaveAttribute("aria-orientation", "vertical");
  });

  it("adds the attached modifier only when isAttached is set", () => {
    const {rerender} = render(
      <Toolbar aria-label="Tools">
        <Button>One</Button>
      </Toolbar>,
    );

    expect(screen.getByRole("toolbar")).not.toHaveClass("toolbar--attached");

    rerender(
      <Toolbar isAttached aria-label="Tools">
        <Button>One</Button>
      </Toolbar>,
    );

    expect(screen.getByRole("toolbar")).toHaveClass("toolbar--attached");
  });

  it("merges a consumer className and forwards the ref", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <Toolbar ref={ref} aria-label="Tools" className="custom">
        <Button>One</Button>
      </Toolbar>,
    );

    expect(screen.getByRole("toolbar")).toHaveClass("toolbar", "custom");
    expect(ref.current).toBe(screen.getByRole("toolbar"));
  });

  it("behaves identically as Toolbar.Root and ToolbarRoot", () => {
    render(
      <>
        <Toolbar.Root aria-label="Namespaced">
          <Button>A</Button>
        </Toolbar.Root>
        <ToolbarRoot aria-label="Flat">
          <Button>B</Button>
        </ToolbarRoot>
      </>,
    );

    for (const name of ["Namespaced", "Flat"]) {
      expect(screen.getByRole("toolbar", {name})).toHaveAttribute("data-slot", "toolbar");
    }
  });

  it("moves focus between controls with the arrow keys", async () => {
    render(
      <Toolbar aria-label="Tools">
        <Button>One</Button>
        <Button>Two</Button>
        <Button>Three</Button>
      </Toolbar>,
    );

    await user.tab();
    expect(screen.getByRole("button", {name: "One"})).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", {name: "Two"})).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("button", {name: "One"})).toHaveFocus();
  });

  it("navigates with the vertical arrow keys when vertical", async () => {
    render(
      <Toolbar aria-label="Tools" orientation="vertical">
        <Button>One</Button>
        <Button>Two</Button>
      </Toolbar>,
    );

    await user.tab();
    await user.keyboard("{ArrowDown}");

    expect(screen.getByRole("button", {name: "Two"})).toHaveFocus();
  });

  it("gives a separator inside the perpendicular orientation", () => {
    render(
      <>
        <Toolbar aria-label="Row">
          <Button>One</Button>
          <Separator />
        </Toolbar>
        <Toolbar aria-label="Column" orientation="vertical">
          <Button>One</Button>
          <Separator />
        </Toolbar>
      </>,
    );
    const [row, column] = screen.getAllByRole("separator");

    expect(row).toHaveClass("separator--vertical");
    expect(column).toHaveClass("separator--horizontal");
  });

  it("passes its orientation to a ToggleButtonGroup inside", () => {
    render(
      <Toolbar aria-label="Tools" orientation="vertical">
        <ToggleButtonGroup aria-label="Style" selectionMode="multiple">
          <ToggleButton id="bold">Bold</ToggleButton>
        </ToggleButtonGroup>
      </Toolbar>,
    );

    expect(screen.getByLabelText("Style")).toHaveAttribute("aria-orientation", "vertical");
  });
});
