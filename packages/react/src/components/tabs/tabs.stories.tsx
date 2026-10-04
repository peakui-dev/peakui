import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import React from "react";
import {cn} from "tailwind-variants";

import {Tabs} from "./index.ts";

/*
 * Каждая история несёт заголовок второго уровня: аудит в apps/storybook/e2e ждёт его как
 * признак готовности превью, без него axe запускается по пустому iframe.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    {children}
  </div>
);

const meta = {
  argTypes: {
    align: {
      control: {type: "select"},
      options: ["start", "center", "end"],
    },
  },
  component: Tabs,
  parameters: {
    layout: "padded",
  },
  title: "Components/Tabs",
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

const DefaultTemplate = (args: Story["args"]) => {
  return (
    <div className="w-[600px]">
      <Tabs {...args}>
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
        <Tabs.Panel className="pt-4" id="overview">
          <p>Обзор проекта и недавняя активность.</p>
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="analytics">
          <p>Метрики и анализ производительности.</p>
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="reports">
          <p>Сборка и выгрузка подробных отчётов.</p>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

const overflowItems = [
  {id: "overview", label: "Обзор"},
  {id: "analytics", label: "Аналитика"},
  {id: "reports", label: "Отчёты"},
  {id: "performance", label: "Производительность"},
  {id: "engagement", label: "Вовлечённость"},
  {id: "audience", label: "Аудитория"},
  {id: "acquisition", label: "Привлечение"},
  {id: "retention", label: "Удержание"},
  {id: "settings", label: "Настройки"},
];

const OverflowTemplate = (args: Story["args"]) => {
  return (
    <div className="w-[400px]">
      <Tabs {...args}>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Разделы с прокруткой">
            {overflowItems.map((item) => (
              <Tabs.Tab key={item.id} id={item.id}>
                {item.label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
        {overflowItems.map((item) => (
          <Tabs.Panel key={item.id} className="pt-4" id={item.id}>
            <p>Содержимое раздела «{item.label}».</p>
          </Tabs.Panel>
        ))}
      </Tabs>
    </div>
  );
};

const VerticalTemplate = (args: Story["args"]) => {
  return (
    <div className="w-[600px]">
      <Tabs {...args} orientation="vertical">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Вертикальные разделы">
            <Tabs.Tab id="account">
              Аккаунт
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="security">
              Безопасность
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="notifications">
              Уведомления
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="billing">
              Оплата
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel className="px-4" id="account">
          <h3 className="mb-2 font-semibold">Настройки аккаунта</h3>
          <p className="text-sm text-muted">Управление данными аккаунта и предпочтениями.</p>
        </Tabs.Panel>
        <Tabs.Panel className="px-4" id="security">
          <h3 className="mb-2 font-semibold">Безопасность</h3>
          <p className="text-sm text-muted">Двухфакторная аутентификация и настройки пароля.</p>
        </Tabs.Panel>
        <Tabs.Panel className="px-4" id="notifications">
          <h3 className="mb-2 font-semibold">Уведомления</h3>
          <p className="text-sm text-muted">Как и когда получать уведомления.</p>
        </Tabs.Panel>
        <Tabs.Panel className="px-4" id="billing">
          <h3 className="mb-2 font-semibold">Оплата</h3>
          <p className="text-sm text-muted">Подписка и способы оплаты.</p>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

const DisabledTabTemplate = (args: Story["args"]) => (
  <div className="w-[600px]">
    <Tabs {...args}>
      <Tabs.ListContainer>
        <Tabs.List aria-label="Разделы с запрещённым">
          <Tabs.Tab id="active">
            Доступный
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab isDisabled id="disabled">
            Запрещённый
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="available">
            Свободный
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel className="pt-4" id="active">
        <p>Раздел доступен для выбора.</p>
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="disabled">
        <p>Содержимое недоступно.</p>
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="available">
        <p>Этот раздел тоже доступен для выбора.</p>
      </Tabs.Panel>
    </Tabs>
  </div>
);

const DefaultSelectedTemplate = (args: Story["args"]) => (
  <div className="w-[600px]">
    <Tabs defaultSelectedKey="default" {...args}>
      <Tabs.ListContainer>
        <Tabs.List aria-label="Разделы со стартовым выбором">
          <Tabs.Tab id="active">
            Первый
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="default">
            Стартовый
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="available">
            Третий
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel className="pt-4" id="active">
        <p>Раздел доступен для выбора.</p>
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="default">
        <p>Этот раздел выбран стартово.</p>
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="available">
        <p>Этот раздел тоже доступен для выбора.</p>
      </Tabs.Panel>
    </Tabs>
  </div>
);

const ControlledSelectionTemplate = (args: Story["args"]) => {
  const [selectedKey, setSelectedKey] = React.useState<string | number>("controlled");

  return (
    <div className="w-[600px]">
      <p className="my-2">Выбрано: {selectedKey}</p>
      <Tabs selectedKey={selectedKey} {...args} onSelectionChange={setSelectedKey}>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Управляемые разделы">
            <Tabs.Tab id="active">
              Первый
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="controlled">
              Управляемый
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="available">
              Третий
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel className="pt-4" id="active">
          <p>Раздел доступен для выбора.</p>
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="controlled">
          <p>Этот раздел выбран состоянием потребителя.</p>
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="available">
          <p>Этот раздел тоже доступен для выбора.</p>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

const CustomStyleTemplate = (args: Story["args"]) => {
  return (
    <div className="w-[380px]">
      <Tabs {...args}>
        <Tabs.ListContainer>
          <Tabs.List
            aria-label="Разделы"
            className="w-fit *:h-6 *:w-fit *:px-3 *:text-sm *:font-normal *:data-[selected=true]:text-accent-foreground"
          >
            <Tabs.Tab id="daily">
              День
              <Tabs.Indicator className="bg-accent" />
            </Tabs.Tab>
            <Tabs.Tab id="weekly">
              Неделя
              <Tabs.Indicator className="bg-accent" />
            </Tabs.Tab>
            <Tabs.Tab id="bi-weekly">
              Две недели
              <Tabs.Indicator className="bg-accent" />
            </Tabs.Tab>
            <Tabs.Tab id="monthly">
              Месяц
              <Tabs.Indicator className="bg-accent" />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
    </div>
  );
};

const WithSeparatorTemplate = (args: Story["args"]) => {
  return (
    <div className="w-[600px]">
      <Tabs {...args}>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Разделы">
            <Tabs.Tab id="overview">
              Обзор
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="analytics">
              <Tabs.Separator />
              Аналитика
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="reports">
              <Tabs.Separator />
              Отчёты
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel className="pt-4" id="overview">
          <p>Обзор проекта и недавняя активность.</p>
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="analytics">
          <p>Метрики и анализ производительности.</p>
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="reports">
          <p>Сборка и выгрузка подробных отчётов.</p>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

const SecondaryTemplate = (args: Story["args"]) => {
  return (
    <div className="w-[600px]">
      <Tabs {...args} variant="secondary">
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
        <Tabs.Panel className="pt-4" id="overview">
          <p>Обзор проекта и недавняя активность.</p>
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="analytics">
          <p>Метрики и анализ производительности.</p>
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="reports">
          <p>Сборка и выгрузка подробных отчётов.</p>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

const Showcase1Template = (args: Story["args"]) => {
  const DEFAULT_ZOOM = 200;
  const [selectedZoom, setSelectedZoom] = React.useState<string | number>(DEFAULT_ZOOM);

  const zoomLevels = [200, 100, 48, 35, 28, 24, 13, "macro"];

  const zoomXMap: Record<number | "macro", string> = {
    [200]: "8x",
    [100]: "4x",
    [48]: "2x",
    [35]: "1.5x",
    [28]: "1.2x",
    [24]: "1x",
    [13]: "0.5x",
    ["macro"]: "0.2x",
  };

  const zoomImgMap: Record<number | "macro", string> = {
    [200]:
      "https://www.apple.com/v/iphone-17-pro/a/images/overview/cameras/zoom/200mm__c8kya18imsqe_large_2x.jpg",
    [100]:
      "https://www.apple.com/v/iphone-17-pro/a/images/overview/cameras/zoom/100mm__cykxcenbhvue_large_2x.jpg",
    [48]: "https://www.apple.com/v/iphone-17-pro/a/images/overview/cameras/zoom/48mm__bmrwps1q6w76_large_2x.jpg",
    [35]: "https://www.apple.com/v/iphone-17-pro/a/images/overview/cameras/zoom/35mm__k375wbkrjp2e_large_2x.jpg",
    [28]: "https://www.apple.com/v/iphone-17-pro/a/images/overview/cameras/zoom/28mm__fylmxo06jq6i_large_2x.jpg",
    [24]: "https://www.apple.com/v/iphone-17-pro/a/images/overview/cameras/zoom/24mm__e54cxtdkdrwy_large_2x.jpg",
    [13]: "https://www.apple.com/v/iphone-17-pro/a/images/overview/cameras/zoom/13mm__dzafu9h1kaye_large_2x.jpg",
    ["macro"]:
      "https://www.apple.com/v/iphone-17-pro/a/images/overview/cameras/zoom/macro__bb7oud7ri2o2_large_2x.jpg",
  };

  return (
    <div className="w-full">
      <div className="flex flex-col items-center">
        <div className="relative aspect-[7/5] w-full max-w-[840px] sm:h-[400px] md:h-[500px] lg:h-[600px]">
          {Object.keys(zoomImgMap).map((key) => (
            <img
              key={key}
              aria-hidden={selectedZoom !== key}
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity delay-200 duration-[800ms] ease-in-out data-[selected=true]:opacity-100 data-[selected=true]:delay-0"
              data-selected={selectedZoom === key}
              src={zoomImgMap[key as keyof typeof zoomImgMap]}
            />
          ))}
        </div>
        <Tabs {...args} defaultSelectedKey={DEFAULT_ZOOM} onSelectionChange={setSelectedZoom}>
          <Tabs.ListContainer className="my-4 w-full max-w-full overflow-x-auto bg-transparent sm:my-6">
            <Tabs.List
              aria-label="Кратности зума"
              className="w-fit min-w-min rounded-full bg-[#333336] *:h-8 *:w-fit *:px-3 *:text-xs *:font-normal *:text-white *:opacity-80 *:hover:opacity-100 *:data-[selected=true]:text-black sm:*:h-9 sm:*:px-4 sm:*:text-sm"
            >
              {zoomLevels.map((zoom) => (
                <Tabs.Tab
                  key={zoom}
                  className={zoom === "macro" ? "capitalize" : ""}
                  id={zoom.toString()}
                >
                  {zoom} {zoom === "macro" ? "" : "мм"}
                  <Tabs.Indicator className="rounded-full bg-white shadow-none duration-[320ms]" />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
        <div className="relative h-10 w-10">
          {Object.keys(zoomXMap).map((key) => (
            <p
              key={key}
              aria-hidden={selectedZoom !== key}
              data-selected={selectedZoom === key}
              className={cn(
                "absolute start-1/2 top-1/2 origin-center -translate-x-1/2 -translate-y-1/2 scale-75 text-[21px] font-medium text-foreground opacity-0 transition-[scale,opacity] duration-[300ms] ease-[cubic-bezier(0.33,1,0.68,1)] ease-in-out-quad data-[selected=true]:scale-100 data-[selected=true]:opacity-100 data-[selected=true]:delay-200",
                {
                  "sr-only": selectedZoom !== key,
                },
              )}
            >
              {zoomXMap[key as keyof typeof zoomXMap]}
            </p>
          ))}
        </div>
        <footer className="mt-4 w-full px-4 text-center text-xs text-muted/30 sm:text-sm">
          <a href="https://www.apple.com/iphone-17-pro/" rel="noopener noreferrer" target="_blank">
            Витрина по образцу обзора камер iPhone 17 Pro от Apple
          </a>
        </footer>
      </div>
    </div>
  );
};

export const Default: Story = {
  args: {
    children: null,
  },
  name: "Базовый",
  render: (args) => (
    <Showcase title="Базовый">
      <DefaultTemplate {...args} />
    </Showcase>
  ),
};

export const Overflow: Story = {
  args: {
    children: null,
  },
  name: "Переполнение",
  render: (args) => (
    <Showcase title="Переполнение">
      <OverflowTemplate {...args} />
    </Showcase>
  ),
};

export const Vertical: Story = {
  args: {
    children: null,
    orientation: "vertical",
  },
  name: "Вертикальные",
  render: (args) => (
    <Showcase title="Вертикальные">
      <VerticalTemplate {...args} />
    </Showcase>
  ),
};

export const VerticalAlign: Story = {
  args: {
    align: "end",
    children: null,
    orientation: "vertical",
    variant: "secondary",
  },
  name: "Вертикальные с выравниванием",
  render: (args) => (
    <Showcase title="Вертикальные с выравниванием">
      <VerticalTemplate {...args} />
    </Showcase>
  ),
};

export const WithDisabledTab: Story = {
  args: {
    children: null,
  },
  name: "С запрещённым разделом",
  render: (args) => (
    <Showcase title="С запрещённым разделом">
      <DisabledTabTemplate {...args} />
    </Showcase>
  ),
};

export const WithDefaultSelectedTab: Story = {
  args: {
    children: null,
  },
  name: "Со стартовым выбором",
  render: (args) => (
    <Showcase title="Со стартовым выбором">
      <DefaultSelectedTemplate {...args} />
    </Showcase>
  ),
};

export const WithControlledSelectionTab: Story = {
  args: {
    children: null,
  },
  name: "С управляемым выбором",
  render: (args) => (
    <Showcase title="С управляемым выбором">
      <ControlledSelectionTemplate {...args} />
    </Showcase>
  ),
};

export const WithCustomStyle: Story = {
  args: {
    children: null,
  },
  name: "С собственными стилями",
  render: (args) => (
    <Showcase title="С собственными стилями">
      <CustomStyleTemplate {...args} />
    </Showcase>
  ),
};

export const WithSeparator: Story = {
  args: {
    children: null,
  },
  name: "С разделителями",
  render: (args) => (
    <Showcase title="С разделителями">
      <WithSeparatorTemplate {...args} />
    </Showcase>
  ),
};

export const Secondary: Story = {
  args: {
    children: null,
    variant: "secondary",
  },
  name: "Вторичный",
  render: (args) => (
    <Showcase title="Вторичный">
      <SecondaryTemplate {...args} />
    </Showcase>
  ),
};

export const SecondaryVertical: Story = {
  args: {
    children: null,
    orientation: "vertical",
    variant: "secondary",
  },
  name: "Вторичный вертикальный",
  render: (args) => (
    <Showcase title="Вторичный вертикальный">
      <VerticalTemplate {...args} />
    </Showcase>
  ),
};

export const Showcase1: Story = {
  args: {
    children: null,
  },
  name: "Витрины/Камеры iPhone 17 Pro",
  render: (args) => (
    <Showcase title="Витрины/Камеры iPhone 17 Pro">
      <Showcase1Template {...args} />
    </Showcase>
  ),
};
