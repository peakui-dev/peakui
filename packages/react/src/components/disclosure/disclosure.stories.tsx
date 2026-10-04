import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import React from "react";

import {Button} from "../button/index.ts";
import {Chip} from "../chip/index.ts";
import {IconSearch} from "../icons.tsx";

import {Disclosure} from "./index.ts";

/*
 * Every story carries a level-two heading: the audit in apps/storybook/e2e waits for it as the
 * sign that the preview is ready, and without it axe runs against an empty iframe and passes.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    {children}
  </div>
);

/* A named component, not an inline render: hooks belong to a component, and lint wants to see it. */
const DefaultExample = () => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="w-full max-w-md text-center">
      <Disclosure isExpanded={isExpanded} onExpandedChange={setIsExpanded}>
        <Disclosure.Heading>
          <Button slot="trigger" variant="secondary">
            <IconSearch />
            Параметры поиска
            <Disclosure.Indicator />
          </Button>
        </Disclosure.Heading>
        <Disclosure.Content>
          <Disclosure.Body className="flex flex-col items-center gap-2 rounded-3xl bg-surface p-4 text-center">
            <p className="text-sm text-muted">
              Расширенные параметры поиска: регистр, целые слова, регулярные выражения.
            </p>
            <div className="aspect-square w-full max-w-40 rounded-2xl bg-muted" />
            <p className="text-sm text-muted">Настройки применяются к новому запросу.</p>
            <Button className="mt-4" variant="primary">
              Применить
            </Button>
          </Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
    </div>
  );
};

const ControlledExample = () => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="primary" onPress={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? "Свернуть" : "Развернуть"} снаружи
        </Button>
        <Chip color={isExpanded ? "success" : "default"}>
          Состояние: {isExpanded ? "развернуто" : "свернуто"}
        </Chip>
      </div>
      <Disclosure isExpanded={isExpanded} onExpandedChange={setIsExpanded}>
        <Disclosure.Trigger className="mb-2 flex w-full items-center justify-between rounded-md border border-gray-300 px-4 py-2 text-start hover:bg-gray-50">
          <span>Переключить содержимое</span>
          <Disclosure.Indicator />
        </Disclosure.Trigger>
        <Disclosure.Content>
          <Disclosure.Body className="rounded-lg border p-4">
            <p className="text-sm">
              Этим раскрытием управляет внешний код: переключить можно кнопкой выше или самим
              триггером.
            </p>
          </Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
    </div>
  );
};

const ProductDetailsExample = () => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="w-full max-w-md">
      <Disclosure isExpanded={isExpanded} onExpandedChange={setIsExpanded}>
        <Disclosure.Trigger className="flex w-full items-center justify-between rounded-md border border-gray-300 px-4 py-2 text-start hover:bg-gray-50">
          <span>Сведения о товаре</span>
          <Disclosure.Indicator />
        </Disclosure.Trigger>
        <Disclosure.Content>
          <Disclosure.Body className="pt-2">
            <div className="space-y-4 rounded-lg border p-4">
              <h3 className="text-lg font-semibold">Сведения о товаре</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Материал:</span>
                  <span>100% хлопок</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Размер:</span>
                  <span>M (38–40)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Цвет:</span>
                  <span>Тёмно-синий</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Уход:</span>
                  <span>Стирка при 30°C</span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Chip color="success">Бесплатная доставка</Chip>
                <Chip color="accent">Гарантия год</Chip>
                <Chip color="warning">Экологично</Chip>
              </div>
            </div>
          </Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
    </div>
  );
};

const meta = {
  component: Disclosure,
  parameters: {
    layout: "padded",
  },
  title: "Components/Disclosure",
} satisfies Meta<typeof Disclosure>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "По умолчанию",
  render: () => (
    <Showcase title="По умолчанию">
      <DefaultExample />
    </Showcase>
  ),
};

export const Controlled: Story = {
  name: "Управляемое",
  render: () => (
    <Showcase title="Управляемое">
      <ControlledExample />
    </Showcase>
  ),
};

export const ProductDetails: Story = {
  name: "Сведения о товаре",
  render: () => (
    <Showcase title="Сведения о товаре">
      <ProductDetailsExample />
    </Showcase>
  ),
};

export const InitiallyExpanded: Story = {
  name: "Развернуто при монтировании",
  render: () => (
    <Showcase title="Развернуто при монтировании">
      <InitialExpandedExample />
    </Showcase>
  ),
};

const InitialExpandedExample = () => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <div className="w-full max-w-md text-center">
      <Disclosure isExpanded={isExpanded} onExpandedChange={setIsExpanded}>
        <Disclosure.Heading>
          <Button slot="trigger" variant="secondary">
            <IconSearch />
            Параметры поиска
            <Disclosure.Indicator />
          </Button>
        </Disclosure.Heading>
        <Disclosure.Content>
          <Disclosure.Body className="flex flex-col items-center gap-2 rounded-3xl bg-surface p-4 text-center">
            <p className="text-sm text-muted">Панель раскрыта с первого рендера.</p>
          </Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
    </div>
  );
};

export const Disabled: Story = {
  name: "Недоступно",
  render: () => (
    <Showcase title="Недоступно">
      <div className="w-full max-w-md text-center">
        <Disclosure isDisabled>
          <Disclosure.Heading>
            <Button slot="trigger" variant="secondary">
              <IconSearch />
              Параметры поиска
              <Disclosure.Indicator />
            </Button>
          </Disclosure.Heading>
          <Disclosure.Content>
            <Disclosure.Body>
              <p className="text-sm text-muted">Содержимое недоступного раскрытия.</p>
            </Disclosure.Body>
          </Disclosure.Content>
        </Disclosure>
      </div>
    </Showcase>
  ),
};
