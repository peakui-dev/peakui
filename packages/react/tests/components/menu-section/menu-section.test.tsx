import type {Key} from "react-aria-components/Menu";

import {User, act, cleanup, render, screen} from "@peakui/testing/helpers";
import {
  Header as HeaderPrimitive,
  Menu as MenuPrimitive,
  MenuTrigger,
  Popover,
} from "react-aria-components/Menu";

import {Button} from "@/components/button";
import {MenuItem} from "@/components/menu-item/index.ts";
import {MenuSection, MenuSectionRoot} from "@/components/menu-section/index.ts";

/*
 * Таймеры OVR-компонентов обновляют React-состояние: без act() обновления не доходят до DOM, и
 * оверлей не открывается. Эталон держит ту же обёртку в своём testing-пакете.
 */
const runAllTimers = () => act(() => vi.runAllTimers());

/*
 * MenuSection — внутренняя часть семейства menu: RAC-примитив не рендерится вне Menu, поэтому
 * фикстура собирает его в сырых MenuTrigger/Popover/Menu с RAC Header как заголовком секции.
 * Такт ведёт RAC-тестер с фейковыми таймерами, как у эталона в тестах menu.
 */
const SectionFixture = ({
  label = "Действия",
  onAction,
  useRoot = false,
}: {
  label?: string;
  onAction?: (key: Key) => void;
  useRoot?: boolean;
} = {}) => {
  const Section = useRoot ? MenuSectionRoot : MenuSection;

  return (
    <MenuTrigger>
      <Button>{label}</Button>
      <Popover>
        <MenuPrimitive onAction={onAction}>
          <Section>
            <HeaderPrimitive>Файл</HeaderPrimitive>
            <MenuItem id="new-file" textValue="Новый файл">
              Новый файл
            </MenuItem>
            <MenuItem id="copy-link" textValue="Копировать ссылку">
              Копировать ссылку
            </MenuItem>
          </Section>
        </MenuPrimitive>
      </Popover>
    </MenuTrigger>
  );
};

describe("MenuSection", () => {
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

  it("рендерит секцию группой с data-slot и БЭМ-блоком", async () => {
    render(<SectionFixture />);

    const tester = await openMenu();

    expect(tester.getSections()).toHaveLength(1);

    const group = screen.getByRole("group");

    expect(group).toHaveAttribute("data-slot", "menu-section");
    expect(group.className).toEqual(expect.stringContaining("menu-section"));
  });

  it("связывает группу с заголовком через aria-labelledby", async () => {
    render(<SectionFixture />);

    await openMenu();

    const group = screen.getByRole("group");
    const header = screen.getByText("Файл");

    expect(group).toHaveAttribute("aria-labelledby", header.id);
  });

  it("ведёт себя одинаково как MenuSection.Root и MenuSectionRoot", async () => {
    render(
      <>
        <SectionFixture label="Именованная" />
        <SectionFixture useRoot label="Плоская" />
      </>,
    );

    const first = user.createTester("Menu", {
      root: screen.getByRole("button", {name: "Именованная"}),
    });

    await first.open();
    runAllTimers();

    expect(screen.getByRole("group")).toHaveAttribute("data-slot", "menu-section");

    await first.close();
    runAllTimers();

    const second = user.createTester("Menu", {
      root: screen.getByRole("button", {name: "Плоская"}),
    });

    await second.open();
    runAllTimers();

    expect(screen.getByRole("group")).toHaveAttribute("data-slot", "menu-section");
  });

  it("подмешивает consumer className к блоку", async () => {
    render(
      <MenuTrigger>
        <Button>Действия</Button>
        <Popover>
          <MenuPrimitive>
            <MenuSection className="custom">
              <MenuItem id="new-file" textValue="Новый файл">
                Новый файл
              </MenuItem>
            </MenuSection>
          </MenuPrimitive>
        </Popover>
      </MenuTrigger>,
    );

    await openMenu();

    expect(screen.getByRole("group").className).toEqual(expect.stringContaining("custom"));
  });

  it("активирует onAction у элементов внутри секции", async () => {
    const onAction = vi.fn();

    render(<SectionFixture onAction={onAction} />);

    const tester = await openMenu();

    await tester.toggleOptionSelection({option: "Копировать ссылку"});
    runAllTimers();

    expect(onAction.mock.calls[0]?.[0]).toBe("copy-link");
  });
});
