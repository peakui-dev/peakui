import type {Key} from "react-aria-components/Menu";

import {User, act, cleanup, render, screen, setupUser} from "@peakui/testing/helpers";
import {
  Menu as MenuPrimitive,
  MenuTrigger,
  Popover,
  SubmenuTrigger,
} from "react-aria-components/Menu";

import {Button} from "@/components/button";
import {MenuItem, MenuItemRoot, MenuItemSubmenuIndicator} from "@/components/menu-item/index.ts";

/*
 * Таймеры OVR-компонентов обновляют React-состояние: без act() обновления не доходят до DOM, и
 * оверлей не открывается. Эталон держит ту же обёртку в своём testing-пакете.
 */
const runAllTimers = () => act(() => vi.runAllTimers());

/*
 * MenuItem — внутренняя часть семейства menu: RAC-примитив не рендерится вне Menu, поэтому
 * фикстура собирает его в сырых MenuTrigger/Popover/Menu. Собственная обёртка меню — отдельная
 * запись дорожной карты (Dropdown) и займёт их место. Как и эталон в своих тестах menu, такт
 * ведёт RAC-тестер с фейковыми таймерами: оверлей RAC на них и рассчитан.
 */
const MenuFixture = ({
  isDisabled = false,
  onAction,
}: {
  isDisabled?: boolean;
  onAction?: (key: Key) => void;
} = {}) => (
  <MenuTrigger>
    <Button>Действия</Button>
    <Popover>
      <MenuPrimitive onAction={onAction}>
        <MenuItem id="new-file" textValue="Новый файл">
          Новый файл
        </MenuItem>
        <MenuItem id="copy-link" isDisabled={isDisabled} textValue="Копировать ссылку">
          Копировать ссылку
        </MenuItem>
      </MenuPrimitive>
    </Popover>
  </MenuTrigger>
);

describe("MenuItem", () => {
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
      root: screen.getByRole("button", {name: "Действия"}),
    });

    await tester.open();
    runAllTimers();

    return tester;
  };

  it("рендерит элемент с ролью menuitem, data-slot и БЭМ-блоком", async () => {
    render(<MenuFixture />);

    await openMenu();

    const item = screen.getByRole("menuitem", {name: "Новый файл"});

    expect(item).toHaveAttribute("data-slot", "menu-item");
    expect(item.className).toEqual(expect.stringContaining("menu-item"));
  });

  it("ведёт себя одинаково как MenuItem.Root и MenuItemRoot", async () => {
    render(
      <>
        <MenuTrigger>
          <Button>Первая</Button>
          <Popover>
            <MenuPrimitive>
              <MenuItem.Root id="one" textValue="Один">
                Один
              </MenuItem.Root>
            </MenuPrimitive>
          </Popover>
        </MenuTrigger>
        <MenuTrigger>
          <Button>Вторая</Button>
          <Popover>
            <MenuPrimitive>
              <MenuItemRoot id="two" textValue="Два">
                Два
              </MenuItemRoot>
            </MenuPrimitive>
          </Popover>
        </MenuTrigger>
      </>,
    );

    const first = user.createTester("Menu", {root: screen.getByRole("button", {name: "Первая"})});

    await first.open();
    runAllTimers();

    expect(screen.getByRole("menuitem", {name: "Один"})).toHaveAttribute("data-slot", "menu-item");

    await first.close();
    runAllTimers();

    const second = user.createTester("Menu", {root: screen.getByRole("button", {name: "Вторая"})});

    await second.open();
    runAllTimers();

    expect(screen.getByRole("menuitem", {name: "Два"})).toHaveAttribute("data-slot", "menu-item");
  });

  it("подмешивает consumer className к блоку", async () => {
    render(
      <MenuTrigger>
        <Button>Действия</Button>
        <Popover>
          <MenuPrimitive>
            <MenuItem className="custom" id="new-file" textValue="Новый файл">
              Новый файл
            </MenuItem>
          </MenuPrimitive>
        </Popover>
      </MenuTrigger>,
    );

    await openMenu();

    expect(screen.getByRole("menuitem", {name: "Новый файл"}).className).toEqual(
      expect.stringContaining("custom"),
    );
  });

  it("применяет модификатор danger по пропу variant", async () => {
    render(
      <MenuTrigger>
        <Button>Действия</Button>
        <Popover>
          <MenuPrimitive>
            <MenuItem id="delete" textValue="Удалить" variant="danger">
              Удалить
            </MenuItem>
          </MenuPrimitive>
        </Popover>
      </MenuTrigger>,
    );

    await openMenu();

    expect(screen.getByRole("menuitem", {name: "Удалить"}).className).toEqual(
      expect.stringContaining("menu-item--danger"),
    );
  });

  it("помечает недоступный элемент data-disabled и не активирует его", async () => {
    const onAction = vi.fn();
    const pointer = setupUser({advanceTimers: vi.advanceTimersByTime});

    render(<MenuFixture isDisabled onAction={onAction} />);

    await openMenu();

    const item = screen.getByRole("menuitem", {name: "Копировать ссылку"});

    expect(item).toHaveAttribute("data-disabled", "true");

    await pointer.click(item);

    expect(onAction).not.toHaveBeenCalled();
  });

  it("вызывает onAction при активации элемента", async () => {
    const onAction = vi.fn();

    render(<MenuFixture onAction={onAction} />);

    const tester = await openMenu();

    await tester.toggleOptionSelection({option: "Копировать ссылку"});
    runAllTimers();

    expect(onAction.mock.calls[0]?.[0]).toBe("copy-link");
  });

  it("активирует элемент с клавиатуры: стрелки и Enter", async () => {
    const onAction = vi.fn();

    render(<MenuFixture onAction={onAction} />);

    const tester = user.createTester("Menu", {
      root: screen.getByRole("button", {name: "Действия"}),
    });

    await tester.open({interactionType: "keyboard"});
    runAllTimers();

    expect(document.activeElement).toBe(screen.getByRole("menuitem", {name: "Новый файл"}));

    await tester.toggleOptionSelection({interactionType: "keyboard", option: "Копировать ссылку"});
    runAllTimers();

    expect(onAction.mock.calls[0]?.[0]).toBe("copy-link");
  });

  it("передаёт рендер-пропы элемента детям-функциям", async () => {
    render(
      <MenuTrigger>
        <Button>Действия</Button>
        <Popover>
          <MenuPrimitive selectedKeys={new Set(["copy-link"])} selectionMode="single">
            <MenuItem id="copy-link" textValue="Копировать ссылку">
              {(values) => <>выбран: {String(values.isSelected)}</>}
            </MenuItem>
          </MenuPrimitive>
        </Popover>
      </MenuTrigger>,
    );

    await openMenu();

    // В режиме одиночного выбора RAC даёт элементу роль menuitemradio.
    expect(screen.getByRole("menuitemradio", {name: "выбран: true"})).toBeInTheDocument();
  });

  describe("Indicator", () => {
    const renderSelectedMenu = () =>
      render(
        <MenuTrigger>
          <Button>Действия</Button>
          <Popover>
            <MenuPrimitive selectedKeys={new Set(["copy-link"])} selectionMode="multiple">
              <MenuItem id="new-file" textValue="Новый файл">
                Новый файл
                <MenuItem.Indicator />
              </MenuItem>
              <MenuItem id="copy-link" textValue="Копировать ссылку">
                Копировать ссылку
                <MenuItem.Indicator />
              </MenuItem>
            </MenuPrimitive>
          </Popover>
        </MenuTrigger>,
      );

    it("рисует индикатор-галочку по умолчанию", async () => {
      render(
        <MenuTrigger>
          <Button>Действия</Button>
          <Popover>
            <MenuPrimitive selectionMode="single">
              <MenuItem id="new-file" textValue="Новый файл">
                Новый файл
                <MenuItem.Indicator />
              </MenuItem>
            </MenuPrimitive>
          </Popover>
        </MenuTrigger>,
      );

      await openMenu();

      const indicator = document.querySelector('[data-slot="menu-item-indicator"]');

      expect(indicator).not.toBeNull();
      expect(indicator).toHaveAttribute("data-type", "checkmark");
      expect(indicator).toHaveAttribute("aria-hidden", "true");
      expect(
        indicator?.querySelector('[data-slot="menu-item-indicator--checkmark"]'),
      ).not.toBeNull();
    });

    it("рисует индикатор-точку по пропу type", async () => {
      render(
        <MenuTrigger>
          <Button>Действия</Button>
          <Popover>
            <MenuPrimitive selectionMode="single">
              <MenuItem id="new-file" textValue="Новый файл">
                Новый файл
                <MenuItem.Indicator type="dot" />
              </MenuItem>
            </MenuPrimitive>
          </Popover>
        </MenuTrigger>,
      );

      await openMenu();

      const indicator = document.querySelector('[data-slot="menu-item-indicator"]');

      expect(indicator).toHaveAttribute("data-type", "dot");
      expect(indicator?.querySelector('[data-slot="menu-item-indicator--dot"]')).not.toBeNull();
    });

    it("показывает индикатор только у выбранного элемента", async () => {
      renderSelectedMenu();

      await openMenu();

      // В режиме множественного выбора RAC даёт элементам роль menuitemcheckbox.
      const selected = screen.getByRole("menuitemcheckbox", {name: "Копировать ссылку"});

      expect(selected.querySelector('[data-slot="menu-item-indicator"]')).toHaveAttribute(
        "data-visible",
        "true",
      );

      const unselected = screen.getByRole("menuitemcheckbox", {name: "Новый файл"});

      expect(unselected.querySelector('[data-slot="menu-item-indicator"]')).not.toHaveAttribute(
        "data-visible",
      );
    });

    it("принимает своё содержимое вместо стандартного глифа", async () => {
      render(
        <MenuTrigger>
          <Button>Действия</Button>
          <Popover>
            <MenuPrimitive selectionMode="single">
              <MenuItem id="new-file" textValue="Новый файл">
                Новый файл
                <MenuItem.Indicator>★</MenuItem.Indicator>
              </MenuItem>
            </MenuPrimitive>
          </Popover>
        </MenuTrigger>,
      );

      await openMenu();

      expect(document.querySelector('[data-slot="menu-item-indicator"]')).toHaveTextContent("★");
    });
  });

  describe("SubmenuIndicator", () => {
    it("рисует шеврон у элемента с подменю и ничего без него", async () => {
      render(
        <MenuTrigger>
          <Button>Действия</Button>
          <Popover>
            <MenuPrimitive>
              <MenuItem id="new-file" textValue="Новый файл">
                Новый файл
                <MenuItemSubmenuIndicator />
              </MenuItem>
              <SubmenuTrigger>
                <MenuItem id="more" textValue="Ещё">
                  Ещё
                  <MenuItemSubmenuIndicator />
                </MenuItem>
                <Popover>
                  <MenuPrimitive>
                    <MenuItem id="deep" textValue="Ещё глубже">
                      Ещё глубже
                    </MenuItem>
                  </MenuPrimitive>
                </Popover>
              </SubmenuTrigger>
            </MenuPrimitive>
          </Popover>
        </MenuTrigger>,
      );

      const tester = await openMenu();

      expect(tester.getSubmenuTriggers()).toHaveLength(1);

      const withSubmenu = screen.getByRole("menuitem", {name: "Ещё"});

      expect(withSubmenu).toHaveAttribute("data-has-submenu", "true");
      expect(withSubmenu.querySelector('[data-slot="submenu-indicator"]')).not.toBeNull();

      const withoutSubmenu = screen.getByRole("menuitem", {name: "Новый файл"});

      expect(withoutSubmenu.querySelector('[data-slot="submenu-indicator"]')).toBeNull();

      const submenu = await tester.openSubmenu({submenuTrigger: "Ещё"});

      runAllTimers();

      expect(screen.getByRole("menuitem", {name: "Ещё глубже"})).toBeInTheDocument();
      expect(submenu.getMenu()).not.toBeNull();
    });
  });
});
