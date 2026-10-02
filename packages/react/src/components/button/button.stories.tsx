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
 * Заголовок второго уровня есть у каждой истории не для красоты: apps/storybook/e2e/Button.spec.ts
 * ждёт его как признак готовности превью перед запуском axe, и за эту же паузу успевает закончиться
 * собственный прогон axe от addon-a11y. История без него роняет аудит ошибкой «Axe is already
 * running».
 */
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
            <span aria-hidden>…</span>
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
 */
export const Pending: Story = {
  name: "Ожидание",
  render: () => (
    <Showcase title="Ожидание">
      <div className="flex flex-wrap items-center gap-3">
        <Button isPending>
          <Spinner color="current" size="sm" />
          Сохраняем
        </Button>
        <Button isPending variant="tertiary">
          <Spinner color="current" size="sm" />
          Загружаем
        </Button>
      </div>
    </Showcase>
  ),
};
