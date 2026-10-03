import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Input} from "../input/index.ts";
import {Label} from "../label/index.ts";

import {TextField} from "./index.ts";

/*
 * Корень поля показывается только в сборе: сам по себе TextField — это flex-колонка без видимого
 * содержимого, и история из одного корня не доказывала бы ничего.
 */

const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    {children}
  </div>
);

const meta = {
  component: TextField,
  parameters: {
    layout: "padded",
  },
  title: "Components/TextField",
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "По умолчанию",
  render: () => (
    <Showcase title="По умолчанию">
      <TextField className="w-72">
        <Label>Город</Label>
        <Input placeholder="Вена" />
      </TextField>
    </Showcase>
  ),
};

export const Variants: Story = {
  name: "Варианты",
  render: () => (
    <Showcase title="Варианты">
      <div className="flex w-72 flex-col gap-4">
        <TextField fullWidth variant="primary">
          <Label>primary</Label>
          <Input placeholder="Вена" />
        </TextField>
        <TextField fullWidth variant="secondary">
          <Label>secondary</Label>
          <Input placeholder="Вена" />
        </TextField>
      </div>
    </Showcase>
  ),
};

export const Required: Story = {
  name: "Обязательное",
  render: () => (
    <Showcase title="Обязательное">
      <TextField isRequired className="w-72">
        <Label>Город</Label>
        <Input placeholder="Вена" />
      </TextField>
    </Showcase>
  ),
};

export const Invalid: Story = {
  name: "Невалидное",
  render: () => (
    <Showcase title="Невалидное">
      <TextField isInvalid className="w-72">
        <Label>Город</Label>
        <Input defaultValue="не город" />
      </TextField>
    </Showcase>
  ),
};

export const Disabled: Story = {
  name: "Недоступное",
  render: () => (
    <Showcase title="Недоступное">
      <TextField isDisabled className="w-72">
        <Label>Город</Label>
        <Input defaultValue="Вена" />
      </TextField>
    </Showcase>
  ),
};

export const FullWidth: Story = {
  name: "Во всю ширину",
  render: () => (
    <Showcase title="Во всю ширину">
      <TextField fullWidth>
        <Label>Город</Label>
        <Input placeholder="Растягивается вместе с полем" />
      </TextField>
    </Showcase>
  ),
};
