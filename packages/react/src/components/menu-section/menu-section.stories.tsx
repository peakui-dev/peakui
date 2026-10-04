import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {
  Header as HeaderPrimitive,
  Menu as MenuPrimitive,
  MenuTrigger,
  Popover,
} from "react-aria-components/Menu";

import {Button} from "../button/index.ts";
import {Description} from "../description/index.ts";
import {Label} from "../label/index.ts";
import {MenuItem} from "../menu-item/index.ts";

import {MenuSection} from "./index.ts";

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
 * MenuSection — внутренняя часть семейства menu, и это её VRT-поверхность: меню открыто сразу
 * (defaultOpen), обёртки — сырые RAC-примитивы с RAC Header как заголовком секции, пока не
 * приземлилась собственная обёртка (Dropdown, отдельная запись дорожной карты).
 */
const MenuSurface = ({children}: {children: ReactNode}) => (
  <MenuTrigger defaultOpen>
    <Button size="sm" variant="tertiary">
      Действия
    </Button>
    <Popover className="bg-overlay text-overlay-foreground rounded-2xl p-1 shadow-overlay">
      <MenuPrimitive className="flex w-64 flex-col gap-0.5 outline-none">{children}</MenuPrimitive>
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
  title: "Components/MenuSection",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Базовый",
  render: () => (
    <Showcase title="Базовый">
      <MenuSurface>
        <MenuSection>
          <HeaderPrimitive>Файл</HeaderPrimitive>
          <MenuItem id="new-file" textValue="Новый файл">
            <Label>Новый файл</Label>
          </MenuItem>
          <MenuItem id="copy-link" textValue="Копировать ссылку">
            <Label>Копировать ссылку</Label>
          </MenuItem>
        </MenuSection>
        <MenuSection>
          <HeaderPrimitive>Документ</HeaderPrimitive>
          <MenuItem id="print" textValue="Печать">
            <Label>Печать</Label>
          </MenuItem>
          <MenuItem id="delete" textValue="Удалить" variant="danger">
            <Label>Удалить</Label>
          </MenuItem>
        </MenuSection>
      </MenuSurface>
    </Showcase>
  ),
};

export const WithDescriptions: Story = {
  name: "С описаниями",
  render: () => (
    <Showcase title="С описаниями">
      <MenuSurface>
        <MenuSection>
          <HeaderPrimitive>Аккаунт</HeaderPrimitive>
          <MenuItem id="profile" textValue="Профиль">
            <Label>Профиль</Label>
            <Description>Имя, аватар и контакты</Description>
          </MenuItem>
          <MenuItem id="settings" textValue="Настройки">
            <Label>Настройки</Label>
            <Description>Язык, тема и уведомления</Description>
          </MenuItem>
        </MenuSection>
      </MenuSurface>
    </Showcase>
  ),
};
