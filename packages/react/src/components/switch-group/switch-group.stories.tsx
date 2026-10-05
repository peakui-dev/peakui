import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Switch} from "../switch/index.ts";

import {SwitchGroup} from "./index.ts";

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

const item = (name: string, label: string) => (
  <Switch name={name}>
    <Switch.Content>
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
      {label}
    </Switch.Content>
  </Switch>
);

const meta = {
  component: SwitchGroup,
  parameters: {
    layout: "padded",
  },
  title: "Components/SwitchGroup",
} satisfies Meta<typeof SwitchGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Обычная",
  render: () => (
    <Showcase title="Обычная">
      <SwitchGroup>
        {item("notifications", "Разрешить уведомления")}
        {item("marketing", "Маркетинговые письма")}
        {item("social", "Обновления соцсетей")}
      </SwitchGroup>
    </Showcase>
  ),
};

export const Horizontal: Story = {
  name: "Горизонтальная",
  render: () => (
    <Showcase title="Горизонтальная">
      <SwitchGroup className="overflow-x-auto" orientation="horizontal">
        {item("notifications", "Уведомления")}
        {item("marketing", "Маркетинг")}
        {item("social", "Соцсети")}
      </SwitchGroup>
    </Showcase>
  ),
};
