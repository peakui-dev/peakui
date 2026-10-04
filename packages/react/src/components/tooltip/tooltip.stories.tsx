import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Button} from "../button/index.ts";
import {Surface} from "../surface/index.ts";

import {Tooltip} from "./index.ts";

/*
 * Заголовок второго уровня есть у каждой истории не для красоты: аудит в apps/storybook/e2e ждёт
 * его как признак готовности превью. Без него axe запускается по ещё пустому iframe, находит ноль
 * нарушений и проходит молча.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    <div className="flex items-center gap-6">{children}</div>
  </div>
);

const InfoGlyph = () => (
  <svg
    aria-hidden
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM7.25 11V7h1.5v4h-1.5Zm.75-5a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

/*
 * Без `component` в meta: у TooltipTrigger проп children обязателен, и StoryObj<typeof meta>
 * тогда требует args с children в каждой истории, у которой есть только render. Истории здесь
 * собраны явными render-функциями, компонент в meta не нужен.
 */
const meta = {
  parameters: {
    layout: "padded",
  },
  title: "Components/Tooltip",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/*
 * delay={0} в каждой истории — не продукт-решение, а тестовое: RAC-дефолт 1500 мс (он же
 * --tooltip-delay в теме) заставил бы каждый аудит и каждый скриншот ждать полторы секунды.
 */
export const Default: Story = {
  name: "Со стрелкой",
  render: () => (
    <Showcase title="Со стрелкой">
      <Tooltip delay={0}>
        <Button isIconOnly aria-label="Подробнее" variant="tertiary">
          <InfoGlyph />
        </Button>
        <Tooltip.Content showArrow>
          <Tooltip.Arrow />
          <p>Подсказка</p>
        </Tooltip.Content>
      </Tooltip>
    </Showcase>
  ),
};

export const WithTrigger: Story = {
  name: "Собственный триггер",
  render: () => (
    <Showcase title="Собственный триггер">
      <Tooltip delay={0}>
        <Tooltip.Trigger aria-label="Триггер подсказки">
          <div className="rounded-full bg-accent-soft p-2 text-accent-soft-foreground">
            <InfoGlyph />
          </div>
        </Tooltip.Trigger>
        <Tooltip.Content showArrow>
          <Tooltip.Arrow />
          <p>Подсказка</p>
        </Tooltip.Content>
      </Tooltip>
    </Showcase>
  ),
};

export const Placements: Story = {
  name: "Положения",
  render: () => (
    <div className="flex flex-col gap-4 bg-background p-6">
      <h2 className="text-sm font-medium text-foreground">Положения</h2>
      <div className="grid grid-cols-3 gap-4">
        <div />
        <Tooltip delay={0}>
          <Button className="w-full" variant="tertiary">
            Сверху
          </Button>
          <Tooltip.Content showArrow placement="top">
            <Tooltip.Arrow />
            <p>placement=&quot;top&quot;</p>
          </Tooltip.Content>
        </Tooltip>
        <div />

        <Tooltip delay={0}>
          <Button className="w-full" variant="tertiary">
            Слева
          </Button>
          <Tooltip.Content showArrow placement="left">
            <Tooltip.Arrow />
            <p>placement=&quot;left&quot;</p>
          </Tooltip.Content>
        </Tooltip>

        <div className="flex items-center justify-center">
          <span className="text-sm text-muted">Наведите на кнопки</span>
        </div>

        <Tooltip delay={0}>
          <Button className="w-full" variant="tertiary">
            Справа
          </Button>
          <Tooltip.Content showArrow placement="right">
            <Tooltip.Arrow />
            <p>placement=&quot;right&quot;</p>
          </Tooltip.Content>
        </Tooltip>

        <div />
        <Tooltip delay={0}>
          <Button className="w-full" variant="tertiary">
            Снизу
          </Button>
          <Tooltip.Content showArrow placement="bottom">
            <Tooltip.Arrow />
            <p>placement=&quot;bottom&quot;</p>
          </Tooltip.Content>
        </Tooltip>
        <div />
      </div>
    </div>
  ),
};

export const OnSurface: Story = {
  name: "На поверхности",
  render: () => (
    <div className="flex flex-col gap-4 bg-background p-6">
      <h2 className="text-sm font-medium text-foreground">На поверхности</h2>
      {/*
       * Кнопка — триггер напрямую, без обёртки Tooltip.Trigger: role="button" обёртки поверх
       * настоящей button даёт вложенные интерактивные элементы, axe ловит это как
       * nested-interactive. Trigger нужен для неинтерактивного содержимого.
       */}
      <Surface className="flex w-[200px] items-center justify-center p-6">
        <Tooltip delay={0}>
          <Button
            isIconOnly
            aria-label="Прикрепить файл"
            className="rounded-full"
            size="lg"
            variant="secondary"
          >
            <svg
              aria-hidden
              fill="none"
              height="16"
              viewBox="0 0 16 16"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                clipRule="evenodd"
                d="M11.78 1.63a2.14 2.14 0 0 1 3.03 3.03l-6.6 6.6a3.5 3.5 0 1 1-4.95-4.95l5.7-5.7.94.95-5.7 5.7a2.17 2.17 0 0 0 3.07 3.06l6.6-6.6a1.14 1.14 0 0 0-1.61-1.61l-6.25 6.24-.94-.94 6.71-6.78Z"
                fill="currentColor"
                fillRule="evenodd"
              />
            </svg>
          </Button>
          <Tooltip.Content showArrow>
            <Tooltip.Arrow />
            <p>Прикрепить файл</p>
          </Tooltip.Content>
        </Tooltip>
      </Surface>
    </div>
  ),
};
