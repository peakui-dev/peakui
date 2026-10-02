import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Spinner} from "./index.ts";

const SIZES = ["sm", "md", "lg", "xl"] as const;
const COLORS = ["accent", "danger", "success", "warning"] as const;

/*
 * Заголовок второго уровня есть у каждой истории не для красоты: apps/storybook/e2e/Button.spec.ts
 * и foundations.a11y.spec.ts ждут его как признак готовности превью перед запуском axe. История
 * без него роняет аудит.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    <div className="flex items-center gap-6">{children}</div>
  </div>
);

const meta = {
  component: Spinner,
  parameters: {
    layout: "padded",
  },
  title: "Components/Spinner",
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Sizes: Story = {
  name: "Размеры",
  render: () => (
    <Showcase title="Размеры">
      {SIZES.map((size) => (
        <Spinner key={size} aria-label={`Загрузка, размер ${size}`} size={size} />
      ))}
    </Showcase>
  ),
};

export const Colors: Story = {
  name: "Цвета",
  render: () => (
    <Showcase title="Цвета">
      {COLORS.map((color) => (
        <Spinner key={color} aria-label={`Загрузка, цвет ${color}`} color={color} />
      ))}
      {/* current наследует цвет текста — так спиннер встаёт внутрь кнопки любого варианта. */}
      <span className="text-danger">
        <Spinner aria-label="Загрузка, цвет текста" color="current" />
      </span>
    </Showcase>
  ),
};
