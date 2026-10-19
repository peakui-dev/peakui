import {render, screen} from "@peakui/testing/helpers";

import {Badge, BadgeRoot} from "@/components/badge/index.ts";

describe("Badge", () => {
  it("wraps a string child in a label and renders the text once, with no implicit role", () => {
    render(<Badge data-testid="badge">New</Badge>);

    const badge = screen.getByTestId("badge");

    expect(screen.getAllByText("New")).toHaveLength(1);
    expect(screen.getByText("New")).toHaveAttribute("data-slot", "badge-label");
    expect(badge).toHaveAttribute("data-slot", "badge");
    expect(badge).not.toHaveAttribute("role");
    expect(badge).not.toHaveAttribute("aria-live");
  });

  it("wraps a numeric child in a label", () => {
    render(<Badge>{3}</Badge>);

    expect(screen.getByText("3")).toHaveAttribute("data-slot", "badge-label");
  });

  it("renders the child 0 rather than dropping it", () => {
    render(<Badge>{0}</Badge>);

    expect(screen.getByText("0")).toHaveAttribute("data-slot", "badge-label");
  });

  it("renders no label element when it has no children, as a dot", () => {
    render(<Badge data-testid="dot" />);

    expect(screen.getByTestId("dot").querySelector('[data-slot="badge-label"]')).toBeNull();
  });

  it("leaves an element child as it is, without a second label", () => {
    render(
      <Badge data-testid="badge">
        <svg data-testid="icon" />
      </Badge>,
    );

    expect(screen.getByTestId("badge").querySelector('[data-slot="badge-label"]')).toBeNull();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("falls back to default, top-right, md and primary", () => {
    render(<Badge data-testid="badge">1</Badge>);

    const {className} = screen.getByTestId("badge");

    for (const modifier of ["default", "top-right", "md", "primary"]) {
      expect(className).toContain(`badge--${modifier}`);
    }
  });

  it.each(["accent", "danger", "default", "success", "warning"] as const)(
    "color %s adds its modifier",
    (color) => {
      render(
        <Badge color={color} data-testid="badge">
          1
        </Badge>,
      );

      expect(screen.getByTestId("badge").className).toContain(`badge--${color}`);
    },
  );

  it.each(["bottom-left", "bottom-right", "top-left", "top-right"] as const)(
    "placement %s adds its modifier",
    (placement) => {
      render(
        <Badge data-testid="badge" placement={placement}>
          1
        </Badge>,
      );

      expect(screen.getByTestId("badge").className).toContain(`badge--${placement}`);
    },
  );

  it.each(["sm", "md", "lg"] as const)("size %s adds its modifier", (size) => {
    render(
      <Badge data-testid="badge" size={size}>
        1
      </Badge>,
    );

    expect(screen.getByTestId("badge").className).toContain(`badge--${size}`);
  });

  it.each(["primary", "secondary", "soft"] as const)("variant %s adds its modifier", (variant) => {
    render(
      <Badge data-testid="badge" variant={variant}>
        1
      </Badge>,
    );

    expect(screen.getByTestId("badge").className).toContain(`badge--${variant}`);
  });

  it("anchors a badge to the element it sits over", () => {
    render(
      <Badge.Anchor data-testid="anchor">
        <span>Inbox</span>
        <Badge>5</Badge>
      </Badge.Anchor>,
    );

    const anchor = screen.getByTestId("anchor");

    expect(anchor).toHaveAttribute("data-slot", "badge-anchor");
    expect(anchor.className).toContain("badge-anchor");
    expect(anchor).toContainElement(screen.getByText("5"));
  });

  it("replaces the element through render", () => {
    render(
      <Badge data-testid="badge" render={(props) => <b {...props} />}>
        1
      </Badge>,
    );

    expect(screen.getByTestId("badge").tagName).toBe("B");
  });

  it("merges a consumer className with the block classes", () => {
    render(
      <Badge className="custom" data-testid="badge">
        1
      </Badge>,
    );

    const {className} = screen.getByTestId("badge");

    expect(className).toContain("custom");
    expect(className).toContain("badge");
  });

  it("behaves identically as Badge.Root and BadgeRoot", () => {
    render(
      <>
        <Badge.Root data-testid="namespaced">1</Badge.Root>
        <BadgeRoot data-testid="flat">1</BadgeRoot>
      </>,
    );

    for (const id of ["namespaced", "flat"]) {
      expect(screen.getByTestId(id)).toHaveAttribute("data-slot", "badge");
    }
  });
});
