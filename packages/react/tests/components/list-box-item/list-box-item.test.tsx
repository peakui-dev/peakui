import type {ListBoxItemRenderProps} from "react-aria-components/ListBox";

import {render, screen, setupUser} from "@peakui/testing/helpers";

import {ListBox} from "@/components/list-box/index.ts";
import {
  ListBoxItem,
  ListBoxItemIndicator,
  ListBoxItemRoot,
} from "@/components/list-box-item/index.ts";

type User = ReturnType<typeof setupUser>;

describe("ListBoxItem", () => {
  let user: User;

  beforeAll(() => {
    user = setupUser();
  });

  it("выставляет роль option, БЭМ-блок и data-slot", () => {
    render(
      <ListBox aria-label="Пользователи" selectionMode="single">
        <ListBoxItem id="bob" textValue="Bob">
          Bob
        </ListBoxItem>
      </ListBox>,
    );

    const option = screen.getByRole("option", {name: "Bob"});

    expect(option).toHaveClass("list-box-item");
    expect(option).toHaveAttribute("data-slot", "list-box-item");
  });

  it("ведёт себя одинаково как ListBoxItem.Root и ListBoxItemRoot", () => {
    render(
      <ListBox aria-label="Пользователи" selectionMode="single">
        <ListBoxItem.Root id="one" textValue="Один">
          Один
        </ListBoxItem.Root>
        <ListBoxItemRoot id="two" textValue="Два">
          Два
        </ListBoxItemRoot>
      </ListBox>,
    );

    expect(screen.getByRole("option", {name: "Один"})).toHaveAttribute(
      "data-slot",
      "list-box-item",
    );
    expect(screen.getByRole("option", {name: "Два"})).toHaveAttribute("data-slot", "list-box-item");
  });

  it("подмешивает consumer className к блоку", () => {
    render(
      <ListBox aria-label="Пользователи" selectionMode="single">
        <ListBoxItem className="custom" id="bob" textValue="Bob">
          Bob
        </ListBoxItem>
      </ListBox>,
    );

    expect(screen.getByRole("option", {name: "Bob"})).toHaveClass("custom");
  });

  it("применяет модификатор варианта danger", () => {
    render(
      <ListBox aria-label="Пользователи" selectionMode="single">
        <ListBoxItem id="bob" textValue="Bob" variant="danger">
          Bob
        </ListBoxItem>
      </ListBox>,
    );

    expect(screen.getByRole("option", {name: "Bob"})).toHaveClass("list-box-item--danger");
  });

  it("получает состояние isSelected в render-функции детей", async () => {
    const renderChild = vi.fn((_values: ListBoxItemRenderProps) => "Bob");

    render(
      <ListBox aria-label="Пользователи" selectionMode="single">
        <ListBoxItem id="bob" textValue="Bob">
          {renderChild}
        </ListBoxItem>
      </ListBox>,
    );

    expect(screen.getByRole("option", {name: "Bob"})).toBeInTheDocument();
    expect(renderChild).toHaveBeenCalled();
    expect(renderChild.mock.calls[0]?.[0]).toHaveProperty("isSelected", false);

    await user.click(screen.getByRole("option", {name: "Bob"}));

    expect(renderChild.mock.calls.at(-1)?.[0]).toHaveProperty("isSelected", true);
  });

  describe("ItemIndicator", () => {
    it("показывает галочку по умолчанию и скрывает её без выбора", () => {
      render(
        <ListBox aria-label="Пользователи" defaultSelectedKeys={["bob"]} selectionMode="single">
          <ListBoxItem id="bob" textValue="Bob">
            Bob
            <ListBoxItemIndicator />
          </ListBoxItem>
          <ListBoxItem id="fred" textValue="Fred">
            Fred
            <ListBoxItemIndicator />
          </ListBoxItem>
        </ListBox>,
      );

      const indicators = document.querySelectorAll('[data-slot="list-box-item-indicator"]');

      expect(indicators).toHaveLength(2);
      expect(indicators[0]).toHaveAttribute("data-visible", "true");
      expect(indicators[1]).not.toHaveAttribute("data-visible");
    });

    it("принимает своё содержимое вместо галочки", () => {
      render(
        <ListBox aria-label="Пользователи" selectionMode="single">
          <ListBoxItem id="bob" textValue="Bob">
            Bob
            <ListBoxItemIndicator>
              <span data-testid="custom-indicator">★</span>
            </ListBoxItemIndicator>
          </ListBoxItem>
        </ListBox>,
      );

      expect(screen.getByTestId("custom-indicator")).toBeInTheDocument();
      expect(document.querySelector('[data-slot="list-box-item-indicator--checkmark"]')).toBeNull();
    });

    it("получает isSelected в render-функции содержимого", async () => {
      render(
        <ListBox aria-label="Пользователи" selectionMode="single">
          <ListBoxItem id="bob" textValue="Bob">
            Bob
            <ListBoxItemIndicator>
              {({isSelected}) => (isSelected ? "да" : "нет")}
            </ListBoxItemIndicator>
          </ListBoxItem>
        </ListBox>,
      );

      expect(screen.getByText("нет")).toBeInTheDocument();

      await user.click(screen.getByRole("option", {name: "Bob"}));

      expect(screen.getByText("да")).toBeInTheDocument();
    });
  });
});
