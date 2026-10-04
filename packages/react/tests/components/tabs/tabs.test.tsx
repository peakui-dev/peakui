import {render, screen, setupUser} from "@peakui/testing/helpers";
import {useState} from "react";

import {Tab, TabIndicator, TabList, TabPanel, Tabs, TabsRoot} from "@/components/tabs/index.ts";

type User = ReturnType<typeof setupUser>;

const PANELS = {
  overview: "Содержимое раздела «Обзор».",
  analytics: "Содержимое раздела «Аналитика».",
  reports: "Содержимое раздела «Отчёты».",
} as const;

/** Стандартная раскладка: три таба в контейнере списков, каждый со индикатором. */
const SimpleTabs = (props: Omit<React.ComponentProps<typeof Tabs>, "children">) => (
  <Tabs {...props}>
    <Tabs.ListContainer>
      <Tabs.List aria-label="Разделы">
        <Tabs.Tab id="overview">
          Обзор
          <Tabs.Indicator />
        </Tabs.Tab>
        <Tabs.Tab id="analytics">
          Аналитика
          <Tabs.Indicator />
        </Tabs.Tab>
        <Tabs.Tab id="reports">
          Отчёты
          <Tabs.Indicator />
        </Tabs.Tab>
      </Tabs.List>
    </Tabs.ListContainer>
    <Tabs.Panel id="overview">{PANELS.overview}</Tabs.Panel>
    <Tabs.Panel id="analytics">{PANELS.analytics}</Tabs.Panel>
    <Tabs.Panel id="reports">{PANELS.reports}</Tabs.Panel>
  </Tabs>
);

/** Подменяет нулевые размеры jsdom на скроллируемый диапазон и следит за scrollTo. */
const stubScrollRange = (scroller: HTMLElement, metrics: Record<string, number>) => {
  for (const [property, value] of Object.entries(metrics)) {
    Object.defineProperty(scroller, property, {configurable: true, value});
  }

  const scrollTo = vi.fn();

  Object.defineProperty(scroller, "scrollTo", {configurable: true, value: scrollTo});

  return scrollTo;
};

const getScroller = () =>
  document.querySelector<HTMLElement>(
    '[data-slot="tabs-list-container"] [data-slot="scroll-shadow"]',
  );

describe("Tabs", () => {
  let user: User;

  beforeAll(() => {
    user = setupUser();
  });

  it("рендерит роли tablist, tab и tabpanel", () => {
    render(<SimpleTabs />);

    expect(screen.getByRole("tablist", {name: "Разделы"})).toBeInTheDocument();
    expect(screen.getByRole("tab", {name: "Обзор"})).toBeInTheDocument();
    expect(screen.getByRole("tab", {name: "Аналитика"})).toBeInTheDocument();
    expect(screen.getByRole("tabpanel")).toHaveTextContent(PANELS.overview);
  });

  it("выставляет data-slot на каждой части", () => {
    render(<SimpleTabs />);

    expect(document.querySelector('[data-slot="tabs"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="tabs-list-container"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="tabs-list"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="tabs-tab"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="tabs-indicator"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="tabs-panel"]')).not.toBeNull();
  });

  it("выставляет БЭМ-блок на корне и подмешивает consumer className", () => {
    render(<SimpleTabs className="custom" data-testid="tabs" />);

    const root = screen.getByTestId("tabs");

    expect(root.className).toEqual(expect.stringContaining("tabs"));
    expect(root.className).toEqual(expect.stringContaining("custom"));
  });

  it("ведёт себя одинаково как Tabs.Root и TabsRoot", () => {
    render(
      <>
        <Tabs.Root>
          <Tabs.List aria-label="Именованные">
            <Tabs.Tab id="one">Один</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel id="one">Панель один</Tabs.Panel>
        </Tabs.Root>
        <TabsRoot>
          <TabList aria-label="Плоские">
            <Tab id="two">Два</Tab>
          </TabList>
          <TabPanel id="two">Панель два</TabPanel>
        </TabsRoot>
      </>,
    );

    for (const [label, panel] of [
      ["Один", "Панель один"],
      ["Два", "Панель два"],
    ] as const) {
      expect(screen.getByRole("tab", {name: label})).toHaveAttribute("data-slot", "tabs-tab");
      expect(screen.getByRole("tabpanel", {name: label})).toHaveTextContent(panel);
    }
  });

  it("выбирает первый таб по умолчанию и держит роуминг таб-индекса на нём", () => {
    render(<SimpleTabs />);

    const overview = screen.getByRole("tab", {name: "Обзор"});
    const analytics = screen.getByRole("tab", {name: "Аналитика"});

    expect(overview).toHaveAttribute("data-selected", "true");
    expect(analytics).not.toHaveAttribute("data-selected");
    expect(overview).toHaveAttribute("tabindex", "0");
    expect(analytics).toHaveAttribute("tabindex", "-1");
  });

  it("клик выбирает таб и заменяет панель", async () => {
    render(<SimpleTabs />);

    await user.click(screen.getByRole("tab", {name: "Аналитика"}));

    expect(screen.getByRole("tab", {name: "Аналитика"})).toHaveAttribute("data-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent(PANELS.analytics);
  });

  it("defaultSelectedKey задаёт стартовый выбор", () => {
    render(<SimpleTabs defaultSelectedKey="reports" />);

    expect(screen.getByRole("tab", {name: "Отчёты"})).toHaveAttribute("data-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent(PANELS.reports);
  });

  it("управляемый selectedKey следует за состоянием потребителя", async () => {
    const Controlled = () => {
      const [selected, setSelected] = useState<string | number>("overview");

      return (
        <>
          <button type="button" onClick={() => setSelected("reports")}>
            Показать отчёты
          </button>
          <SimpleTabs selectedKey={selected} onSelectionChange={setSelected} />
        </>
      );
    };

    render(<Controlled />);

    await user.click(screen.getByRole("button", {name: "Показать отчёты"}));

    expect(screen.getByRole("tab", {name: "Отчёты"})).toHaveAttribute("data-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent(PANELS.reports);
  });

  it("onSelectionChange получает ключ выбранного таба", async () => {
    const onSelectionChange = vi.fn();

    render(<SimpleTabs onSelectionChange={onSelectionChange} />);

    await user.click(screen.getByRole("tab", {name: "Отчёты"}));

    expect(onSelectionChange).toHaveBeenCalledWith("reports");
  });

  it("запрещённый таб не выбирается кликом", async () => {
    render(
      <Tabs>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Разделы">
            <Tabs.Tab id="active">
              Доступный
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab isDisabled id="closed">
              Запрещённый
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel id="active">Доступная панель</Tabs.Panel>
        <Tabs.Panel id="closed">Недоступная панель</Tabs.Panel>
      </Tabs>,
    );

    const disabled = screen.getByRole("tab", {name: "Запрещённый"});

    expect(disabled).toHaveAttribute("data-disabled", "true");

    await user.click(disabled);

    expect(disabled).not.toHaveAttribute("data-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Доступная панель");
  });

  describe("клавиатура", () => {
    it("ArrowRight и ArrowLeft переносят выбор", async () => {
      render(<SimpleTabs />);

      await user.click(screen.getByRole("tab", {name: "Обзор"}));
      await user.keyboard("[ArrowRight]");

      expect(screen.getByRole("tab", {name: "Аналитика"})).toHaveAttribute("data-selected", "true");

      await user.keyboard("[ArrowLeft]");

      expect(screen.getByRole("tab", {name: "Обзор"})).toHaveAttribute("data-selected", "true");
    });

    it("Home и End прыгают к краям списка", async () => {
      render(<SimpleTabs />);

      await user.click(screen.getByRole("tab", {name: "Обзор"}));
      await user.keyboard("[End]");

      expect(screen.getByRole("tab", {name: "Отчёты"})).toHaveAttribute("data-selected", "true");

      await user.keyboard("[Home]");

      expect(screen.getByRole("tab", {name: "Обзор"})).toHaveAttribute("data-selected", "true");
    });

    it("в вертикальной ориентации выбирает вертикальными стрелками", async () => {
      render(<SimpleTabs orientation="vertical" />);

      await user.click(screen.getByRole("tab", {name: "Обзор"}));
      await user.keyboard("[ArrowDown]");

      expect(screen.getByRole("tab", {name: "Аналитика"})).toHaveAttribute("data-selected", "true");

      await user.keyboard("[ArrowUp]");

      expect(screen.getByRole("tab", {name: "Обзор"})).toHaveAttribute("data-selected", "true");
    });
  });

  describe("ориентация и варианты", () => {
    it("выставляет data-orientation на корне и списке", () => {
      render(<SimpleTabs data-testid="tabs" orientation="vertical" />);

      expect(screen.getByTestId("tabs")).toHaveAttribute("data-orientation", "vertical");
      expect(screen.getByRole("tablist")).toHaveAttribute("data-orientation", "vertical");
    });

    it("добавляет модификатор вторичного варианта", () => {
      render(<SimpleTabs data-testid="tabs" variant="secondary" />);

      expect(screen.getByTestId("tabs").className).toEqual(
        expect.stringContaining("tabs--secondary"),
      );
    });

    it("добавляет модификаторы выравнивания содержимого табов", () => {
      const {rerender} = render(<SimpleTabs align="end" data-testid="tabs" />);

      expect(screen.getByTestId("tabs").className).toEqual(
        expect.stringContaining("tabs--align-end"),
      );

      rerender(<SimpleTabs align="start" data-testid="tabs" />);

      expect(screen.getByTestId("tabs").className).toEqual(
        expect.stringContaining("tabs--align-start"),
      );
    });
  });

  describe("контейнер списка", () => {
    it("рендерит кнопки прокрутки с доступными именами вне таб-порядка", () => {
      render(<SimpleTabs />);

      const prev = screen.getByRole("button", {name: "Scroll tabs left"});
      const next = screen.getByRole("button", {name: "Scroll tabs right"});

      expect(prev).toHaveAttribute("tabindex", "-1");
      expect(next).toHaveAttribute("tabindex", "-1");
    });

    it("в вертикальной ориентации зовёт кнопки вверх и вниз", () => {
      render(<SimpleTabs orientation="vertical" />);

      expect(screen.getByRole("button", {name: "Scroll tabs up"})).toBeInTheDocument();
      expect(screen.getByRole("button", {name: "Scroll tabs down"})).toBeInTheDocument();
    });

    it("без ListContainer остаётся тонкой обёрткой без кнопок прокрутки", () => {
      render(
        <Tabs>
          <Tabs.List aria-label="Разделы">
            <Tabs.Tab id="overview">Обзор</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel id="overview">{PANELS.overview}</Tabs.Panel>
        </Tabs>,
      );

      expect(screen.getByRole("tab", {name: "Обзор"})).toBeInTheDocument();
      expect(document.querySelector('[data-slot="tabs-list-container"]')).toBeNull();
      expect(screen.queryByRole("button", {name: /scroll tabs/i})).not.toBeInTheDocument();
    });

    it("прокручивает на 80% ширины области по кнопке «вправо»", async () => {
      render(<SimpleTabs />);

      const scroller = getScroller();

      expect(scroller).not.toBeNull();
      const scrollTo = stubScrollRange(scroller!, {
        clientWidth: 100,
        scrollLeft: 0,
        scrollWidth: 300,
      });

      await user.click(screen.getByRole("button", {name: "Scroll tabs right"}));

      expect(scrollTo).toHaveBeenCalledWith({behavior: "smooth", left: 80});
    });

    it("не прокручивает назад в начале диапазона", async () => {
      render(<SimpleTabs />);

      const scroller = getScroller();
      const scrollTo = stubScrollRange(scroller!, {
        clientWidth: 100,
        scrollLeft: 0,
        scrollWidth: 300,
      });

      await user.click(screen.getByRole("button", {name: "Scroll tabs left"}));

      expect(scrollTo).not.toHaveBeenCalled();
    });

    it("ограничивает прокрутку краем диапазона", async () => {
      render(<SimpleTabs />);

      const scroller = getScroller();
      const scrollTo = stubScrollRange(scroller!, {
        clientWidth: 100,
        scrollLeft: 250,
        scrollWidth: 300,
      });

      await user.click(screen.getByRole("button", {name: "Scroll tabs right"}));

      expect(scrollTo).toHaveBeenCalledWith({behavior: "smooth", left: 200});
    });

    it("в вертикальной ориентации прокручивает по высоте", async () => {
      render(<SimpleTabs orientation="vertical" />);

      const scroller = getScroller();
      const scrollTo = stubScrollRange(scroller!, {
        clientHeight: 100,
        scrollHeight: 300,
        scrollTop: 0,
      });

      await user.click(screen.getByRole("button", {name: "Scroll tabs down"}));

      expect(scrollTo).toHaveBeenCalledWith({behavior: "smooth", top: 80});
    });
  });

  describe("разделитель", () => {
    it("рендерится скрытым от вспомогательных технологий", () => {
      render(
        <Tabs>
          <Tabs.ListContainer>
            <Tabs.List aria-label="Разделы">
              <Tabs.Tab id="overview">Обзор</Tabs.Tab>
              <Tabs.Tab id="analytics">
                <Tabs.Separator />
                Аналитика
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
          <Tabs.Panel id="overview">{PANELS.overview}</Tabs.Panel>
          <Tabs.Panel id="analytics">{PANELS.analytics}</Tabs.Panel>
        </Tabs>,
      );

      const separator = document.querySelector('[data-slot="tabs-separator"]');

      expect(separator).not.toBeNull();
      expect(separator).toHaveAttribute("aria-hidden", "true");
      expect(separator?.className).toEqual(expect.stringContaining("tabs__separator"));
    });
  });

  it("пробрасывает data-атрибуты в корень", () => {
    render(<SimpleTabs data-foo="bar" data-testid="tabs" />);

    expect(screen.getByTestId("tabs")).toHaveAttribute("data-foo", "bar");
  });

  it("прокидывает className в отдельные части", () => {
    render(
      <Tabs>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Разделы" className="custom-list">
            <Tabs.Tab className="custom-tab" id="overview">
              Обзор
              <TabIndicator className="custom-indicator" />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <TabPanel className="custom-panel" id="overview">
          {PANELS.overview}
        </TabPanel>
      </Tabs>,
    );

    expect(screen.getByRole("tablist").className).toEqual(expect.stringContaining("custom-list"));
    expect(screen.getByRole("tab").className).toEqual(expect.stringContaining("custom-tab"));
    expect(screen.getByRole("tabpanel").className).toEqual(expect.stringContaining("custom-panel"));
    expect(document.querySelector('[data-slot="tabs-indicator"]')?.className).toEqual(
      expect.stringContaining("custom-indicator"),
    );
  });
});
