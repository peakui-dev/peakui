import {User, render, screen, setupUser} from "@peakui/testing/helpers";
import {Header} from "react-aria-components/ListBox";

import {ListBox, ListBoxRoot} from "@/components/list-box/index.ts";

type SelectionUser = ReturnType<typeof setupUser>;

/** Стандартная раскладка: три опции со значениями для typeahead. */
const renderUsers = (props: Omit<React.ComponentProps<typeof ListBox>, "children"> = {}) =>
  render(
    <ListBox aria-label="Пользователи" data-testid="users" selectionMode="single" {...props}>
      <ListBox.Item id="bob" textValue="Bob">
        Bob
        <ListBox.ItemIndicator />
      </ListBox.Item>
      <ListBox.Item id="fred" textValue="Fred">
        Fred
        <ListBox.ItemIndicator />
      </ListBox.Item>
      <ListBox.Item id="martha" textValue="Martha">
        Martha
        <ListBox.ItemIndicator />
      </ListBox.Item>
    </ListBox>,
  );

describe("ListBox", () => {
  let testUtilUser: User;
  let user: SelectionUser;

  beforeAll(() => {
    testUtilUser = new User({interactionType: "mouse"});
    user = setupUser();
  });

  it("выставляет роль listbox, БЭМ-блок и data-slot", () => {
    renderUsers();

    const listbox = screen.getByRole("listbox", {name: "Пользователи"});

    expect(listbox).toHaveAttribute("data-slot", "list-box");
    expect(listbox).toHaveClass("list-box");
    expect(document.querySelector('[data-slot="list-box-item"]')).not.toBeNull();
  });

  it("выставляет data-slot на каждой части", () => {
    renderUsers();

    expect(document.querySelector('[data-slot="list-box"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="list-box-item"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="list-box-item-indicator"]')).not.toBeNull();
  });

  it("подмешивает consumer className к блоку", () => {
    renderUsers({className: "custom"});

    expect(screen.getByRole("listbox", {name: "Пользователи"})).toHaveClass("custom");
  });

  it("ведёт себя одинаково как ListBox.Root и ListBoxRoot", () => {
    render(
      <>
        <ListBox.Root aria-label="Именованный">
          <ListBox.Item id="one" textValue="Один">
            Один
          </ListBox.Item>
        </ListBox.Root>
        <ListBoxRoot aria-label="Плоский">
          <ListBox.Item id="two" textValue="Два">
            Два
          </ListBox.Item>
        </ListBoxRoot>
      </>,
    );

    expect(screen.getByRole("listbox", {name: "Именованный"})).toHaveAttribute(
      "data-slot",
      "list-box",
    );
    expect(screen.getByRole("listbox", {name: "Плоский"})).toHaveAttribute("data-slot", "list-box");
  });

  it("вызывает onSelectionChange при выборе опции мышью", async () => {
    const onSelectionChange = vi.fn();

    renderUsers({onSelectionChange});

    const tester = testUtilUser.createTester("ListBox", {
      root: screen.getByTestId("users"),
    });

    expect(tester.getOptions()).toHaveLength(3);

    await tester.toggleOptionSelection({option: "Fred"});

    expect(onSelectionChange).toHaveBeenCalled();

    const selection = onSelectionChange.mock.calls.at(-1)?.[0];

    expect(selection === "all" ? null : [...selection]).toEqual(["fred"]);
    expect(tester.getSelectedOptions()).toHaveLength(1);
  });

  it("в режиме single заменяет выбор: отмечена одна опция", async () => {
    renderUsers();

    const tester = testUtilUser.createTester("ListBox", {
      root: screen.getByTestId("users"),
    });

    await tester.toggleOptionSelection({option: "Bob"});
    await tester.toggleOptionSelection({option: "Martha"});

    const selected = tester.getSelectedOptions();

    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveAttribute("data-selected", "true");
  });

  it("в режиме multiple накапливает выбор и держит его с клавиатуры", async () => {
    const onSelectionChange = vi.fn();

    renderUsers({onSelectionChange, selectionMode: "multiple"});

    const tester = testUtilUser.createTester("ListBox", {
      root: screen.getByTestId("users"),
    });

    await tester.toggleOptionSelection({option: "Bob"});
    await tester.toggleOptionSelection({option: "Fred"});

    const selected = tester.getSelectedOptions();

    expect(selected).toHaveLength(2);

    const selection = onSelectionChange.mock.calls.at(-1)?.[0];

    expect(selection === "all" ? null : [...selection]).toEqual(["bob", "fred"]);
  });

  it("выбирает опции клавишами: стрелки двигают фокус, Enter выбирает", async () => {
    const onSelectionChange = vi.fn();

    renderUsers({onSelectionChange});

    await user.tab();
    expect(screen.getByRole("option", {name: "Bob"})).toHaveFocus();
    expect(screen.getByRole("option", {name: "Bob"})).toHaveAttribute("data-focused", "true");

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", {name: "Fred"})).toHaveAttribute("data-focused", "true");

    await user.keyboard("{Enter}");

    const selection = onSelectionChange.mock.calls.at(-1)?.[0];

    expect(selection === "all" ? null : [...selection]).toEqual(["fred"]);
    expect(screen.getByRole("option", {name: "Fred"})).toHaveAttribute("data-selected", "true");
  });

  it("показывает индикатор выбора только на отмеченной опции", async () => {
    renderUsers();

    const tester = testUtilUser.createTester("ListBox", {
      root: screen.getByTestId("users"),
    });

    await tester.toggleOptionSelection({option: "Bob"});

    const indicators = document.querySelectorAll('[data-slot="list-box-item-indicator"]');
    const visible = [...indicators].filter((indicator) => indicator.hasAttribute("data-visible"));

    expect(visible).toHaveLength(1);
    expect(visible[0]).toHaveAttribute("data-visible", "true");
  });

  it("не выбирает отключённые опции", async () => {
    const onSelectionChange = vi.fn();

    render(
      <ListBox
        aria-label="Пользователи"
        data-testid="users"
        disabledKeys={["bob"]}
        selectionMode="single"
        onSelectionChange={onSelectionChange}
      >
        <ListBox.Item id="bob" textValue="Bob">
          Bob
        </ListBox.Item>
        <ListBox.Item id="fred" textValue="Fred">
          Fred
        </ListBox.Item>
      </ListBox>,
    );

    expect(screen.getByRole("option", {name: "Bob"})).toHaveAttribute("data-disabled", "true");

    await user.click(screen.getByRole("option", {name: "Bob"}));

    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it("поддерживает секции с onAction при selectionMode none", async () => {
    const onAction = vi.fn();

    render(
      <ListBox aria-label="Действия с файлом" selectionMode="none" onAction={onAction}>
        <ListBox.Section>
          <Header>Действия</Header>
          <ListBox.Item id="new-file" textValue="Новый файл">
            Новый файл
          </ListBox.Item>
          <ListBox.Item id="copy-link" textValue="Копировать ссылку">
            Копировать ссылку
          </ListBox.Item>
        </ListBox.Section>
      </ListBox>,
    );

    const tester = testUtilUser.createTester("ListBox", {
      root: screen.getByRole("listbox", {name: "Действия с файлом"}),
    });

    expect(tester.getSections()).toHaveLength(1);

    await tester.toggleOptionSelection({option: "Копировать ссылку"});
    expect(onAction).toHaveBeenCalledWith("copy-link");
  });
});
