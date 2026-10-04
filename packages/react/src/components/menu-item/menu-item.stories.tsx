import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {
  Menu as MenuPrimitive,
  MenuTrigger,
  Popover,
  SubmenuTrigger,
} from "react-aria-components/Menu";

import {Button} from "../button/index.ts";
import {Description} from "../description/index.ts";
import {Label} from "../label/index.ts";

import {MenuItem} from "./index.ts";

/*
 * Заголовок второго уровня есть у каждой истории: аудит в apps/storybook/e2e ждёт его как признак
 * готовности превью. Без него axe запускается по пустому iframe и молча проходит.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    <div className="flex flex-col gap-8">{children}</div>
  </div>
);

/*
 * MenuItem — внутренняя часть семейства menu, и это её VRT-поверхность: меню открыто сразу
 * (defaultOpen), а обёртки — сырые RAC-примитивы, пока не приземлилась собственная обёртка
 * (Dropdown, отдельная запись дорожной карты).
 */
const MenuSurface = ({
  children,
  selectedKeys,
  selectionMode,
}: {
  children: ReactNode;
  selectedKeys?: "all" | Set<string>;
  selectionMode?: "single" | "multiple";
}) => (
  <MenuTrigger defaultOpen>
    <Button size="sm" variant="tertiary">
      Действия
    </Button>
    <Popover className="bg-overlay text-overlay-foreground rounded-2xl p-1 shadow-overlay">
      <MenuPrimitive
        className="flex w-64 flex-col gap-0.5 outline-none"
        selectedKeys={selectedKeys}
        selectionMode={selectionMode}
      >
        {children}
      </MenuPrimitive>
    </Popover>
  </MenuTrigger>
);

/*
 * Без `component` в meta: у StoryObj<typeof meta> иначе обязательны args с children в каждой
 * истории, у которой есть только render. Истории здесь собраны явными render-функциями.
 */
const meta = {
  parameters: {
    layout: "padded",
  },
  title: "Components/MenuItem",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Базовый",
  render: () => (
    <Showcase title="Базовый">
      <MenuSurface>
        <MenuItem id="new-file" textValue="Новый файл">
          <Label>Новый файл</Label>
        </MenuItem>
        <MenuItem id="copy-link" textValue="Копировать ссылку">
          <Label>Копировать ссылку</Label>
        </MenuItem>
        <MenuItem id="download" textValue="Скачать">
          <Label>Скачать</Label>
        </MenuItem>
      </MenuSurface>
    </Showcase>
  ),
};

export const WithDescription: Story = {
  name: "С описанием",
  render: () => (
    <Showcase title="С описанием">
      <MenuSurface>
        <MenuItem id="new-file" textValue="Новый файл">
          <Label>Новый файл</Label>
          <Description>Создать файл в текущей папке</Description>
        </MenuItem>
        <MenuItem id="copy-link" textValue="Копировать ссылку">
          <Label>Копировать ссылку</Label>
          <Description>Скопировать адрес страницы в буфер</Description>
        </MenuItem>
      </MenuSurface>
    </Showcase>
  ),
};

export const Danger: Story = {
  name: "Опасное действие",
  render: () => (
    <Showcase title="Опасное действие">
      <MenuSurface>
        <MenuItem id="new-file" textValue="Новый файл">
          <Label>Новый файл</Label>
        </MenuItem>
        <MenuItem id="delete" textValue="Удалить" variant="danger">
          <Label>Удалить</Label>
        </MenuItem>
      </MenuSurface>
    </Showcase>
  ),
};

export const WithCheckmark: Story = {
  name: "С галочкой выбора",
  render: () => (
    <Showcase title="С галочкой выбора">
      <MenuSurface selectedKeys={new Set(["copy-link"])} selectionMode="multiple">
        <MenuItem id="new-file" textValue="Новый файл">
          <Label>Новый файл</Label>
          <MenuItem.Indicator />
        </MenuItem>
        <MenuItem id="copy-link" textValue="Копировать ссылку">
          <Label>Копировать ссылку</Label>
          <MenuItem.Indicator />
        </MenuItem>
      </MenuSurface>
    </Showcase>
  ),
};

export const WithDot: Story = {
  name: "С точкой выбора",
  render: () => (
    <Showcase title="С точкой выбора">
      <MenuSurface selectedKeys={new Set(["compact"])} selectionMode="single">
        <MenuItem id="compact" textValue="Компактный">
          <Label>Компактный</Label>
          <MenuItem.Indicator type="dot" />
        </MenuItem>
        <MenuItem id="comfortable" textValue="Просторный">
          <Label>Просторный</Label>
          <MenuItem.Indicator type="dot" />
        </MenuItem>
      </MenuSurface>
    </Showcase>
  ),
};

export const WithSubmenu: Story = {
  name: "С подменю",
  render: () => (
    <Showcase title="С подменю">
      <MenuSurface>
        <MenuItem id="new-file" textValue="Новый файл">
          <Label>Новый файл</Label>
        </MenuItem>
        <SubmenuTrigger>
          <MenuItem id="export" textValue="Экспорт">
            <Label>Экспорт</Label>
            <MenuItem.SubmenuIndicator />
          </MenuItem>
          <Popover className="bg-overlay text-overlay-foreground rounded-2xl p-1 shadow-overlay">
            <MenuPrimitive className="flex w-64 flex-col gap-0.5 outline-none">
              <MenuItem id="export-pdf" textValue="PDF">
                <Label>PDF</Label>
              </MenuItem>
              <MenuItem id="export-png" textValue="PNG">
                <Label>PNG</Label>
              </MenuItem>
            </MenuPrimitive>
          </Popover>
        </SubmenuTrigger>
      </MenuSurface>
    </Showcase>
  ),
};

export const Disabled: Story = {
  name: "Недоступный элемент",
  render: () => (
    <Showcase title="Недоступный элемент">
      <MenuSurface>
        <MenuItem id="new-file" textValue="Новый файл">
          <Label>Новый файл</Label>
        </MenuItem>
        <MenuItem isDisabled id="copy-link" textValue="Копировать ссылку">
          <Label>Копировать ссылку</Label>
        </MenuItem>
      </MenuSurface>
    </Showcase>
  ),
};
