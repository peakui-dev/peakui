import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Spinner} from "../spinner/index.ts";

import {Button} from "./index.ts";

/*
 * Истории React-компонента. Стилевой слой доказывается отдельно, в
 * apps/storybook/src/stories/button.stories.tsx — там голая разметка без React, и одно не
 * заменяет другое.
 */

const VARIANTS = [
  "primary",
  "secondary",
  "tertiary",
  "danger",
  "danger-soft",
  "ghost",
  "outline",
] as const;

const SIZES = ["sm", "md", "lg"] as const;

/*
 * Заголовок второго уровня есть у каждой истории не для красоты: аудит в apps/storybook/e2e/ ждёт
 * его как признак готовности превью. Без него axe запускается по ещё пустому iframe, находит ноль
 * нарушений и проходит молча.
 */
/*
 * Настоящий svg, а не текстовая заглушка: размер иконок внутри кнопки задаёт правило
 * `& svg:not(…)` в button.css, и проверить его можно только на реальном элементе.
 */
const EllipsisIcon = () => (
  <svg aria-hidden fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="5" cy="12" fill="currentColor" r="2" />
    <circle cx="12" cy="12" fill="currentColor" r="2" />
    <circle cx="19" cy="12" fill="currentColor" r="2" />
  </svg>
);

const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    {children}
  </div>
);

const meta = {
  component: Button,
  parameters: {
    layout: "padded",
  },
  title: "Components/Button",
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  name: "Варианты и размеры",
  render: () => (
    <Showcase title="Варианты и размеры">
      {SIZES.map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-3">
          {VARIANTS.map((variant) => (
            <Button key={variant} size={size} variant={variant}>
              {variant}
            </Button>
          ))}
        </div>
      ))}
    </Showcase>
  ),
};

export const IconOnly: Story = {
  name: "Только иконка",
  render: () => (
    <Showcase title="Только иконка">
      <div className="flex items-center gap-3">
        {SIZES.map((size) => (
          /*
           * aria-label на каждой: кнопка-иконка без доступного имени — нарушение WCAG, которое
           * компонент не может исправить за потребителя. Стори эталона его не ставят; здесь
           * ставят, потому что история — это ещё и рецепт.
           */
          <Button key={size} isIconOnly aria-label={`Ещё, размер ${size}`} size={size}>
            <EllipsisIcon />
          </Button>
        ))}
      </div>
    </Showcase>
  ),
};

export const FullWidth: Story = {
  name: "Во всю ширину",
  render: () => (
    <Showcase title="Во всю ширину">
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Button fullWidth>Сохранить</Button>
        <Button fullWidth variant="tertiary">
          Отмена
        </Button>
      </div>
    </Showcase>
  ),
};

export const Disabled: Story = {
  name: "Недоступна",
  render: () => (
    <Showcase title="Недоступна">
      <div className="flex flex-wrap items-center gap-3">
        {VARIANTS.map((variant) => (
          <Button key={variant} isDisabled variant={variant}>
            {variant}
          </Button>
        ))}
      </div>
    </Showcase>
  ),
};

/*
 * Единственное место в репозитории, где показан рецепт isPending, и поэтому он здесь именно
 * такой: индикатор ставит ПОТРЕБИТЕЛЬ в children. Так устроен эталон и так устроен пример в
 * документации самой RAC. Компонент не рендерит спиннер за вас — и не должен: метка «Сохраняем»
 * контекстна, библиотека не знает, сохранение это, отправка или загрузка.
 *
 * RAC сам блокирует нажатие и hover, сохраняя фокусируемость; стиль приходит из
 * .button[data-pending] в @peakui/styles.
 *
 * aria-hidden на индикаторе обязателен, а не на вкус: Spinner — это role="status" с
 * aria-label="Loading", и внутри кнопки его метка вливается в её доступное имя. Без aria-hidden
 * кнопка объявляется как «Loading Сохраняем». Проверено тестом на имя целиком.
 *
 * Оставшийся пробел записан в docs/ecosystem/backlog.md: RAC заводит progressId и ждёт индикатор,
 * умеющий ProgressBarContext, а Spinner — обычный span. Поэтому для кнопки-иконки под pending
 * ассистивное объявление не несёт сведений о загрузке. Закрыть это значит заставить Button
 * потреблять контекст — против решения «Button не добавляет к isPending ничего».
 */
export const Pending: Story = {
  name: "Ожидание",
  render: () => (
    <Showcase title="Ожидание">
      <div className="flex flex-wrap items-center gap-3">
        <Button isPending>
          <Spinner aria-hidden color="current" size="sm" />
          Сохраняем
        </Button>
        <Button isPending variant="tertiary">
          <Spinner aria-hidden color="current" size="sm" />
          Загружаем
        </Button>
      </div>
    </Showcase>
  ),
};
