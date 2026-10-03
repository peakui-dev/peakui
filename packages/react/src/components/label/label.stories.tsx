import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Label} from "./index.ts";

/*
 * Модификаторы Label показаны пропами — это случай подписи ВНЕ поля. Внутри TextField те же
 * состояния приходят каскадом от корня, и это видно в историях TextField.
 */

const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    {children}
  </div>
);

const meta = {
  component: Label,
  parameters: {
    layout: "padded",
  },
  title: "Components/Label",
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "По умолчанию",
  render: () => (
    <Showcase title="По умолчанию">
      <Label>Город</Label>
    </Showcase>
  ),
};

export const States: Story = {
  name: "Состояния",
  render: () => (
    <Showcase title="Состояния">
      <div className="flex flex-col gap-2">
        <Label isRequired>Обязательное</Label>
        <Label isInvalid>Невалидное</Label>
        <Label isDisabled>Недоступное</Label>
      </div>
    </Showcase>
  ),
};
