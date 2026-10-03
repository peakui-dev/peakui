import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Input} from "../input/index.ts";
import {Label} from "../label/index.ts";
import {TextField} from "../textfield/index.ts";

import {Description} from "./index.ts";

/*
 * Description показан только внутри поля, и это не оформление истории: вне слота описание
 * возвращает null, а внутри — получает id от корня поля. История, рисующая его отдельно, обещала бы
 * контракт, которого нет.
 */

const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    {children}
  </div>
);

const meta = {
  component: Description,
  parameters: {
    layout: "padded",
  },
  title: "Components/Description",
} satisfies Meta<typeof Description>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "По умолчанию",
  render: () => (
    <Showcase title="По умолчанию">
      <TextField className="w-72">
        <Label>Город</Label>
        <Input placeholder="Вена" />
        <Description>Город, в котором вы живёте</Description>
      </TextField>
    </Showcase>
  ),
};

export const HiddenWhileInvalid: Story = {
  name: "Скрыто у невалидного поля",
  render: () => (
    <Showcase title="Скрыто у невалидного поля">
      <div className="flex w-72 flex-col gap-4">
        <TextField fullWidth>
          <Label>Валидное</Label>
          <Input placeholder="Вена" />
          <Description>Описание видно</Description>
        </TextField>
        <TextField fullWidth isInvalid>
          <Label>Невалидное</Label>
          <Input defaultValue="не город" />
          <Description>Это описание скрыто — его место занимает ошибка</Description>
        </TextField>
      </div>
    </Showcase>
  ),
};
