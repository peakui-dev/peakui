import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Description} from "../description/index.ts";
import {Input} from "../input/index.ts";
import {Label} from "../label/index.ts";
import {TextField} from "../textfield/index.ts";

import {FieldError} from "./index.ts";

/*
 * Сообщение существует только у невалидного поля: примитив RAC не рендерит его, пока поле валидно.
 * Поэтому обе истории — пары, в которых видно и отсутствие сообщения.
 */

const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    {children}
  </div>
);

const meta = {
  component: FieldError,
  parameters: {
    layout: "padded",
  },
  title: "Components/FieldError",
} satisfies Meta<typeof FieldError>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "По умолчанию",
  render: () => (
    <Showcase title="По умолчанию">
      <div className="flex w-72 flex-col gap-4">
        <TextField fullWidth>
          <Label>Валидное</Label>
          <Input placeholder="Вена" />
          <FieldError>Сообщения нет, пока поле валидно</FieldError>
        </TextField>
        <TextField fullWidth isInvalid>
          <Label>Невалидное</Label>
          <Input defaultValue="не город" />
          <FieldError>Укажите город из списка</FieldError>
        </TextField>
      </div>
    </Showcase>
  ),
};

export const WithDescription: Story = {
  name: "Вместе с описанием",
  render: () => (
    <Showcase title="Вместе с описанием">
      <TextField fullWidth isInvalid className="w-72">
        <Label>Город</Label>
        <Input defaultValue="не город" />
        <Description>Описание уступает место ошибке</Description>
        <FieldError>Укажите город из списка</FieldError>
      </TextField>
    </Showcase>
  ),
};
