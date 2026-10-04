import type {Key, Selection} from "react-aria-components/Menu";

import {User, act, cleanup, render, screen, setupUser} from "@peakui/testing/helpers";
import React, {useState} from "react";
import {Header as HeaderPrimitive} from "react-aria-components/Menu";

import {Button} from "@/components/button/index.ts";
import {Dropdown, DropdownRoot} from "@/components/dropdown/index.ts";
import {Label} from "@/components/label/index.ts";

/*
 * Таймеры OVR-компонентов обновляют React-состояние: без act() обновления не доходят до DOM, и
 * оверлей не открывается. Эталон держит ту же обёртку в своём testing-пакете.
 */
const runAllTimers = () => act(() => vi.runAllTimers());

/*
 * Фикстура повторяет DropdownFixture эталона: три элемента, опасный — с вариантом danger.
 * Триггер здесь — собственная обёртка Dropdown.Trigger над RAC Button.
 */
const DropdownFixture = ({
  defaultOpen = false,
  onAction,
}: {
  defaultOpen?: boolean;
  onAction?: (key: Key) => void;
} = {}) => (
  <Dropdown defaultOpen={defaultOpen}>
    <Dropdown.Trigger aria-label="Меню">Действия</Dropdown.Trigger>
    <Dropdown.Popover>
      <Dropdown.Menu onAction={onAction}>
        <Dropdown.Item id="new-file" textValue="Новый файл">
          <Label>Новый файл</Label>
        </Dropdown.Item>
        <Dropdown.Item id="copy-link" textValue="Копировать ссылку">
          <Label>Копировать ссылку</Label>
        </Dropdown.Item>
        <Dropdown.Item id="delete-file" textValue="Удалить файл" variant="danger">
          <Label>Удалить файл</Label>
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown.Popover>
  </Dropdown>
);

describe("Dropdown", () => {
  let user: User;

  beforeEach(() => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    user = new User({interactionType: "mouse", advanceTimer: vi.advanceTimersByTime});
  });

  afterEach(() => {
    cleanup();
    runAllTimers();
    vi.useRealTimers();
  });

  const openMenu = async () => {
    const tester = user.createTester("Menu", {
      root: screen.getByRole("button", {name: "Меню"}),
    });

    await tester.open();
    runAllTimers();

    return tester;
  };

  it("выставляет data-slot триггеру в закрытом состоянии", () => {
    render(<DropdownFixture />);

    expect(document.querySelector('[data-slot="dropdown-trigger"]')).not.toBeNull();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("открывает меню мышью и активирует элемент", async () => {
    const onAction = vi.fn();

    render(<DropdownFixture onAction={onAction} />);

    const tester = await openMenu();
    const menu = tester.getMenu();

    expect(menu).not.toBeNull();
    expect(menu).toHaveAttribute("data-slot", "dropdown-menu");
    expect(document.querySelector('[data-slot="dropdown-popover"]')).not.toBeNull();
    expect(tester.getOptions()).toHaveLength(3);

    await tester.toggleOptionSelection({option: "Копировать ссылку"});
    runAllTimers();

    expect(onAction.mock.calls[0]?.[0]).toBe("copy-link");
    expect(tester.getMenu()).toBeNull();
  });

  it("открывает меню с клавиатуры и активирует элемент", async () => {
    const onAction = vi.fn();

    render(<DropdownFixture onAction={onAction} />);

    const tester = user.createTester("Menu", {
      root: screen.getByRole("button", {name: "Меню"}),
      interactionType: "keyboard",
    });

    await tester.open();
    runAllTimers();

    expect(tester.getMenu()).not.toBeNull();

    await tester.toggleOptionSelection({interactionType: "keyboard", option: "Удалить файл"});
    runAllTimers();

    expect(onAction.mock.calls[0]?.[0]).toBe("delete-file");
    expect(tester.getMenu()).toBeNull();
  });

  it("закрывается по Escape без активации", async () => {
    const onAction = vi.fn();

    render(<DropdownFixture onAction={onAction} />);

    const tester = await openMenu();

    expect(tester.getMenu()).not.toBeNull();

    await tester.close();
    runAllTimers();

    expect(tester.getMenu()).toBeNull();
    expect(onAction).not.toHaveBeenCalled();
  });

  it("ведёт себя одинаково как Dropdown.Root и DropdownRoot", async () => {
    render(
      <>
        <DropdownRoot>
          <Dropdown.Trigger aria-label="Первая">Первая</Dropdown.Trigger>
          <Dropdown.Popover>
            <Dropdown.Menu>
              <Dropdown.Item id="one" textValue="Один">
                <Label>Один</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </DropdownRoot>
        <Dropdown.Root>
          <Dropdown.Trigger aria-label="Вторая">Вторая</Dropdown.Trigger>
          <Dropdown.Popover>
            <Dropdown.Menu>
              <Dropdown.Item id="two" textValue="Два">
                <Label>Два</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown.Root>
      </>,
    );

    const first = user.createTester("Menu", {root: screen.getByRole("button", {name: "Первая"})});

    await first.open();
    runAllTimers();

    expect(screen.getByRole("menuitem", {name: "Один"})).toBeInTheDocument();

    await first.close();
    runAllTimers();

    const second = user.createTester("Menu", {root: screen.getByRole("button", {name: "Вторая"})});

    await second.open();
    runAllTimers();

    expect(screen.getByRole("menuitem", {name: "Два"})).toBeInTheDocument();
  });

  it("контролирует открытие через isOpen и onOpenChange", async () => {
    const ControlledFixture = () => {
      const [open, setOpen] = useState(false);

      return (
        <Dropdown isOpen={open} onOpenChange={setOpen}>
          <Dropdown.Trigger aria-label="Меню">Действия</Dropdown.Trigger>
          <Dropdown.Popover>
            <Dropdown.Menu>
              <Dropdown.Item id="new-file" textValue="Новый файл">
                <Label>Новый файл</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      );
    };

    render(<ControlledFixture />);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    const tester = await openMenu();

    expect(tester.getMenu()).not.toBeNull();

    await tester.close();
    runAllTimers();

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("принимает кнопку Button как триггер без Dropdown.Trigger", async () => {
    const onAction = vi.fn();

    render(
      <Dropdown>
        <Button aria-label="Меню" variant="secondary">
          Действия
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu onAction={onAction}>
            <Dropdown.Item id="new-file" textValue="Новый файл">
              <Label>Новый файл</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>,
    );

    const tester = user.createTester("Menu", {root: screen.getByRole("button")});

    await tester.open();
    runAllTimers();

    expect(tester.getOptions()).toHaveLength(1);

    await tester.toggleOptionSelection({option: "Новый файл"});
    runAllTimers();

    expect(onAction.mock.calls[0]?.[0]).toBe("new-file");
  });

  describe("выбор", () => {
    it("поддерживает одиночный выбор с ролью menuitemradio", async () => {
      const onSelectionChange = vi.fn();

      render(
        <Dropdown>
          <Dropdown.Trigger aria-label="Меню">Действия</Dropdown.Trigger>
          <Dropdown.Popover>
            <Dropdown.Menu
              defaultSelectedKeys={["apple"]}
              selectionMode="single"
              onSelectionChange={onSelectionChange}
            >
              <Dropdown.Item id="apple" textValue="Яблоко">
                <Dropdown.ItemIndicator />
                <Label>Яблоко</Label>
              </Dropdown.Item>
              <Dropdown.Item id="pear" textValue="Груша">
                <Dropdown.ItemIndicator />
                <Label>Груша</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>,
      );

      const tester = await openMenu();
      const menu = tester.getMenu();

      expect(menu).toHaveAttribute("data-selection-mode", "single");

      const selected = screen.getByRole("menuitemradio", {name: "Яблоко"});

      expect(selected).toHaveAttribute("aria-checked", "true");

      await tester.toggleOptionSelection({option: "Груша"});
      runAllTimers();

      expect(onSelectionChange).toHaveBeenCalled();
    });

    it("поддерживает множественный выбор с ролью menuitemcheckbox", async () => {
      render(
        <Dropdown>
          <Dropdown.Trigger aria-label="Меню">Действия</Dropdown.Trigger>
          <Dropdown.Popover>
            <Dropdown.Menu defaultSelectedKeys={["apple"]} selectionMode="multiple">
              <Dropdown.Item id="apple" textValue="Яблоко">
                <Dropdown.ItemIndicator />
                <Label>Яблоко</Label>
              </Dropdown.Item>
              <Dropdown.Item id="pear" textValue="Груша">
                <Dropdown.ItemIndicator />
                <Label>Груша</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>,
      );

      await openMenu();

      expect(screen.getByRole("menuitemcheckbox", {name: "Яблоко"})).toHaveAttribute(
        "aria-checked",
        "true",
      );
      expect(screen.getByRole("menuitemcheckbox", {name: "Груша"})).toHaveAttribute(
        "aria-checked",
        "false",
      );
    });

    it("передаёт рендер-пропы элемента детям-функциям", async () => {
      render(
        <Dropdown>
          <Dropdown.Trigger aria-label="Меню">Действия</Dropdown.Trigger>
          <Dropdown.Popover>
            <Dropdown.Menu defaultSelectedKeys={["apple"]} selectionMode="single">
              <Dropdown.Item id="apple" textValue="Яблоко">
                {(values) => <>выбрано: {String(values.isSelected)}</>}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>,
      );

      await openMenu();

      expect(screen.getByRole("menuitemradio", {name: "выбрано: true"})).toBeInTheDocument();
    });
  });

  describe("секции", () => {
    it("группирует элементы с доступным заголовком", async () => {
      render(
        <Dropdown>
          <Dropdown.Trigger aria-label="Меню">Действия</Dropdown.Trigger>
          <Dropdown.Popover>
            <Dropdown.Menu>
              <Dropdown.Section>
                <HeaderPrimitive>Файл</HeaderPrimitive>
                <Dropdown.Item id="new-file" textValue="Новый файл">
                  <Label>Новый файл</Label>
                </Dropdown.Item>
              </Dropdown.Section>
              <Dropdown.Section>
                <HeaderPrimitive>Опасное</HeaderPrimitive>
                <Dropdown.Item id="delete-file" textValue="Удалить" variant="danger">
                  <Label>Удалить</Label>
                </Dropdown.Item>
              </Dropdown.Section>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>,
      );

      const tester = await openMenu();

      expect(tester.getOptions()).toHaveLength(2);
      expect(screen.getByRole("group", {name: "Файл"})).toBeInTheDocument();
      expect(screen.getByRole("group", {name: "Опасное"})).toBeInTheDocument();
    });

    it("несёт собственный выбор на уровне секции", async () => {
      let selection: "all" | Set<Key> = new Set();

      const SectionFixture = () => {
        const [selected, setSelected] = useState<Selection>(new Set(["bold"]));

        return (
          <Dropdown>
            <Dropdown.Trigger aria-label="Меню">Стили</Dropdown.Trigger>
            <Dropdown.Popover>
              <Dropdown.Menu>
                <Dropdown.Section
                  selectedKeys={selected}
                  selectionMode="multiple"
                  onSelectionChange={(keys) => {
                    selection = keys;
                    setSelected(keys);
                  }}
                >
                  <Dropdown.Item id="bold" textValue="Полужирный">
                    <Dropdown.ItemIndicator />
                    <Label>Полужирный</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="italic" textValue="Курсив">
                    <Dropdown.ItemIndicator />
                    <Label>Курсив</Label>
                  </Dropdown.Item>
                </Dropdown.Section>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        );
      };

      render(<SectionFixture />);

      const pointer = setupUser({advanceTimers: vi.advanceTimersByTime});

      await openMenu();

      /*
       * Режим выбора живёт на секции, а тестер RAC читает его с корневого меню — кликаем
       * напрямую, как это делает менюшный тест недоступного элемента.
       */
      await pointer.click(screen.getByRole("menuitemcheckbox", {name: "Курсив"}));
      runAllTimers();

      expect(Array.from(selection as Set<Key>).sort()).toEqual(["bold", "italic"]);
    });
  });

  describe("подменю", () => {
    it("открывает вложенное меню по SubmenuTrigger", async () => {
      render(
        <Dropdown>
          <Dropdown.Trigger aria-label="Меню">Поделиться</Dropdown.Trigger>
          <Dropdown.Popover>
            <Dropdown.Menu>
              <Dropdown.Item id="copy-link" textValue="Копировать ссылку">
                <Label>Копировать ссылку</Label>
              </Dropdown.Item>
              <Dropdown.SubmenuTrigger>
                <Dropdown.Item id="other" textValue="Ещё">
                  <Label>Ещё</Label>
                  <Dropdown.SubmenuIndicator />
                </Dropdown.Item>
                <Dropdown.Popover>
                  <Dropdown.Menu>
                    <Dropdown.Item id="telegram" textValue="Telegram">
                      <Label>Telegram</Label>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown.SubmenuTrigger>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>,
      );

      const tester = await openMenu();

      expect(tester.getSubmenuTriggers()).toHaveLength(1);
      expect(screen.getByRole("menuitem", {name: "Ещё"})).toHaveAttribute(
        "data-has-submenu",
        "true",
      );

      await tester.openSubmenu({submenuTrigger: "Ещё"});
      runAllTimers();

      expect(screen.getByRole("menuitem", {name: "Telegram"})).toBeInTheDocument();
    });
  });
});
