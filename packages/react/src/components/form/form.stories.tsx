import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Button} from "../button/index.ts";
import {Description} from "../description/index.ts";
import {FieldError} from "../field-error/index.ts";
import {Input} from "../input/index.ts";
import {Label} from "../label/index.ts";
import {TextField} from "../textfield/index.ts";

import {Form} from "./index.ts";

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

const meta = {
  component: Form,
  parameters: {
    layout: "padded",
  },
  title: "Components/Form",
} satisfies Meta<typeof Form>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Обычная",
  render: () => (
    <Showcase title="Обычная">
      <Form aria-label="Профиль" className="flex flex-col gap-4">
        <TextField isRequired name="name">
          <Label>Имя</Label>
          <Input />
          <FieldError />
        </TextField>
        <TextField isRequired name="email">
          <Label>Почта</Label>
          <Input type="email" />
          <Description>Мы не показываем её другим</Description>
          <FieldError />
        </TextField>
        <Button type="submit">Сохранить</Button>
      </Form>
    </Showcase>
  ),
};
