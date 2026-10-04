import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Button} from "../button/index.ts";
import {IconSearch} from "../icons.tsx";

import {EmptyState} from "./index.ts";

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
  component: EmptyState,
  parameters: {
    layout: "padded",
  },
  title: "Components/EmptyState",
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

/* No children — the component's own default message renders. */
export const Default: Story = {
  name: "Дефолтная фраза",
  render: () => (
    <Showcase title="Дефолтная фраза">
      <EmptyState className="w-64" />
    </Showcase>
  ),
};

export const CustomMessage: Story = {
  name: "Своё сообщение",
  render: () => (
    <Showcase title="Своё сообщение">
      <EmptyState className="w-64">Здесь пока нет ни одного проекта</EmptyState>
    </Showcase>
  ),
};

/*
 * The block has no parts of its own: an icon, a title and a description are plain children the
 * consumer composes.
 */
export const WithIcon: Story = {
  name: "С иконкой и описанием",
  render: () => (
    <Showcase title="С иконкой и описанием">
      <EmptyState className="flex w-72 flex-col items-center gap-1 py-8 text-center">
        <IconSearch height={24} width={24} />
        <p className="text-sm font-medium text-foreground">Ничего не найдено</p>
        <p>Попробуйте изменить запрос или сбросить фильтры</p>
      </EmptyState>
    </Showcase>
  ),
};

export const WithAction: Story = {
  name: "С действием",
  render: () => (
    <Showcase title="С действием">
      <EmptyState className="flex w-72 flex-col items-center gap-3 py-8 text-center">
        <p className="text-sm font-medium text-foreground">Список пуст</p>
        <p>Создайте первый проект, чтобы начать работу</p>
        <Button variant="secondary">Создать проект</Button>
      </EmptyState>
    </Showcase>
  ),
};
