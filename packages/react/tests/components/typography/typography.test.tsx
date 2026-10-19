import {render, screen} from "@peakui/testing/helpers";

import {
  Code,
  Heading,
  Paragraph,
  Prose,
  Typography,
  TypographyRoot,
} from "@/components/typography/index.ts";

describe("Typography", () => {
  it("renders a paragraph body with the start alignment and the default color", () => {
    render(<Typography>Text</Typography>);

    const element = screen.getByText("Text");

    expect(element.tagName).toBe("P");
    expect(element).toHaveAttribute("data-slot", "typography");
    expect(element).toHaveAttribute("data-type", "body");
    expect(element.className).toContain("typography--body");
    expect(element.className).toContain("typography--align-start");
    expect(element.className).toContain("typography--color-default");
  });

  it.each([
    ["h1", "H1"],
    ["h2", "H2"],
    ["h3", "H3"],
    ["h4", "H4"],
    ["h5", "H5"],
    ["h6", "H6"],
    ["body", "P"],
    ["body-sm", "P"],
    ["body-xs", "P"],
    ["code", "CODE"],
  ] as const)("type %s renders the %s element", (type, tag) => {
    render(<TypographyRoot type={type}>Text</TypographyRoot>);

    const element = screen.getByText("Text");

    expect(element.tagName).toBe(tag);
    expect(element).toHaveAttribute("data-type", type);
    expect(element.className).toContain(`typography--${type}`);
  });

  it("renders Heading as h1 by default and as hN for its level", () => {
    render(
      <>
        <Heading>One</Heading>
        <Heading level={3}>Three</Heading>
      </>,
    );

    expect(screen.getByRole("heading", {level: 1, name: "One"})).toHaveAttribute("data-type", "h1");
    expect(screen.getByRole("heading", {level: 3, name: "Three"})).toHaveAttribute(
      "data-type",
      "h3",
    );
  });

  it.each([
    [undefined, "body"],
    ["base", "body"],
    ["sm", "body-sm"],
    ["xs", "body-xs"],
  ] as const)("Paragraph size %s renders a p of type %s", (size, type) => {
    render(<Paragraph size={size}>Text</Paragraph>);

    const element = screen.getByText("Text");

    expect(element.tagName).toBe("P");
    expect(element).toHaveAttribute("data-type", type);
  });

  it("renders Code as a code element", () => {
    render(<Code>pnpm test</Code>);

    expect(screen.getByText("pnpm test").tagName).toBe("CODE");
  });

  it("maps truncate, align, weight and color to their modifiers", () => {
    render(
      <Typography truncate align="end" color="muted" weight="bold">
        Text
      </Typography>,
    );

    const {className} = screen.getByText("Text");

    for (const modifier of ["truncate", "align-end", "color-muted", "weight-bold"]) {
      expect(className).toContain(`typography--${modifier}`);
    }
  });

  it("adds no truncate or weight modifier by default", () => {
    render(<Typography>Text</Typography>);

    const {className} = screen.getByText("Text");

    expect(className).not.toContain("typography--truncate");
    expect(className).not.toContain("typography--weight");
  });

  it("merges a consumer className with the block classes", () => {
    render(<Typography className="custom">Text</Typography>);

    const {className} = screen.getByText("Text");

    expect(className).toContain("custom");
    expect(className).toContain("typography");
  });

  it("wraps descendants in a prose block", () => {
    render(
      <Prose data-testid="prose">
        <h2>Title</h2>
      </Prose>,
    );

    const prose = screen.getByTestId("prose");

    expect(prose.tagName).toBe("DIV");
    expect(prose).toHaveAttribute("data-slot", "prose");
    expect(prose.className).toContain("typography-prose");
    expect(prose).toContainElement(screen.getByRole("heading", {name: "Title"}));
  });

  it("behaves identically as Typography.Root and TypographyRoot", () => {
    render(
      <>
        <Typography.Root>Namespaced</Typography.Root>
        <TypographyRoot>Flat</TypographyRoot>
      </>,
    );

    for (const text of ["Namespaced", "Flat"]) {
      expect(screen.getByText(text)).toHaveAttribute("data-slot", "typography");
    }
  });
});
