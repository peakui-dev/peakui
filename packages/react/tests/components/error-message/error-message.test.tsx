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
  it("рендерит сообщение внутри группы тегов", () => {
    render(group(<ErrorMessage>Select at least one category</ErrorMessage>));

    expect(screen.getByText("Select at least one category")).toBeInTheDocument();
  });

  it("связывает сообщение с группой через aria-describedby", () => {
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

  it("выставляет BEM-блок и data-slot", () => {
    render(group(<ErrorMessage>Select at least one category</ErrorMessage>));
    const message = screen.getByText("Select at least one category");

    expect(message.className).toEqual(expect.stringContaining("error-message"));
    expect(message).toHaveAttribute("data-slot", "error-message");
  });

  it("не рендерит ничего внутри гейта без слота errorMessage", () => {
    render(
      <FieldSlotsGateContext value>
        <ErrorMessage>Select at least one category</ErrorMessage>
      </FieldSlotsGateContext>,
    );

    expect(screen.queryByText("Select at least one category")).not.toBeInTheDocument();
  });

  it("передаёт ref на отрендеренный элемент", () => {
    const ref = createRef<HTMLElement>();

    render(group(<ErrorMessage ref={ref}>Select at least one category</ErrorMessage>));

    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it("ведёт себя одинаково как ErrorMessage.Root и ErrorMessageRoot", () => {
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
