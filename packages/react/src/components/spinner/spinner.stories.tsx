import type {Meta, StoryObj} from "@storybook/react-vite";

import {Spinner} from "./index.ts";

const SIZES = ["sm", "md", "lg", "xl"] as const;
const COLORS = ["accent", "danger", "success", "warning"] as const;

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
    <div className="flex items-center gap-6 bg-background p-6">
      {SIZES.map((size) => (
        <Spinner key={size} aria-label={`Загрузка, размер ${size}`} size={size} />
      ))}
    </div>
  ),
};

export const Colors: Story = {
  name: "Цвета",
  render: () => (
    <div className="flex items-center gap-6 bg-background p-6">
      {COLORS.map((color) => (
        <Spinner key={color} aria-label={`Загрузка, цвет ${color}`} color={color} />
      ))}
      {/* current наследует цвет текста — так спиннер встаёт внутрь кнопки любого варианта. */}
      <span className="text-danger">
        <Spinner aria-label="Загрузка, цвет текста" color="current" />
      </span>
    </div>
  ),
};
