import {render, screen} from "@peakui/testing/helpers";
import {createRef} from "react";

import {ErrorMessage, ErrorMessageRoot} from "@/components/error-message/index.ts";
import {Tag} from "@/components/tag/index.ts";
import {TagGroup} from "@/components/tag-group/index.ts";
import {FieldSlotsGateContext} from "@/hooks/use-has-text-slot.ts";

const group = (node: React.ReactNode) => (
  <TagGroup aria-label="Categories" selectionMode="multiple">
    <TagGroup.List>
      <Tag id="news">News</Tag>
      <Tag id="travel">Travel</Tag>
    </TagGroup.List>
    {node}
  </TagGroup>
);

describe("ErrorMessage", () => {
  it("renders the message inside a tag group", () => {
    render(group(<ErrorMessage>Select at least one category</ErrorMessage>));

    expect(screen.getByText("Select at least one category")).toBeInTheDocument();
  });

  it("describes the group it sits in while it is rendered", () => {
    render(
      <TagGroup aria-label="Categories" selectionMode="multiple">
        <TagGroup.List>
          <Tag id="news">News</Tag>
          <Tag id="travel">Travel</Tag>
        </TagGroup.List>
        <ErrorMessage>Select at least one category</ErrorMessage>
      </TagGroup>,
    );

    expect(screen.getByRole("grid")).toHaveAccessibleDescription("Select at least one category");
  });

  it("exposes BEM block and data-slot", () => {
    render(group(<ErrorMessage>Select at least one category</ErrorMessage>));
    const message = screen.getByText("Select at least one category");

    expect(message.className).toEqual(expect.stringContaining("error-message"));
    expect(message).toHaveAttribute("data-slot", "error-message");
  });

  it("renders nothing inside a gate with no error message slot", () => {
    render(
      <FieldSlotsGateContext value>
        <ErrorMessage>Select at least one category</ErrorMessage>
      </FieldSlotsGateContext>,
    );

    expect(screen.queryByText("Select at least one category")).not.toBeInTheDocument();
  });

  it("forwards ref to the rendered element", () => {
    const ref = createRef<HTMLElement>();

    render(group(<ErrorMessage ref={ref}>Select at least one category</ErrorMessage>));

    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it("behaves identically as ErrorMessage.Root and ErrorMessageRoot", () => {
    render(
      <>
        {group(<ErrorMessage.Root>Namespaced</ErrorMessage.Root>)}
        {group(<ErrorMessageRoot>Flat</ErrorMessageRoot>)}
      </>,
    );

    for (const text of ["Namespaced", "Flat"]) {
      expect(screen.getByText(text)).toHaveAttribute("data-slot", "error-message");
    }
  });
});
