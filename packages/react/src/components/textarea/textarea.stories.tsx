import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Surface} from "../surface/index.ts";

import {TextArea} from "./index.ts";

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
  component: TextArea,
  parameters: {
    layout: "padded",
  },
  title: "Components/TextArea",
} satisfies Meta<typeof TextArea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Обычная",
  render: () => (
    <Showcase title="Обычная">
      <TextArea aria-label="Описание" placeholder="Опишите продукт" />
    </Showcase>
  ),
};

export const Variants: Story = {
  name: "Варианты",
  render: () => (
    <Showcase title="Варианты">
      <div className="flex w-[280px] flex-col gap-2">
        <TextArea fullWidth aria-label="Основная" placeholder="Основная" variant="primary" />
        <TextArea
          fullWidth
          aria-label="Второстепенная"
          placeholder="Второстепенная"
          variant="secondary"
        />
      </div>
    </Showcase>
  ),
};

export const FullWidth: Story = {
  name: "Во всю ширину",
  render: () => (
    <Showcase title="Во всю ширину">
      <div className="w-[400px] space-y-3">
        <TextArea fullWidth aria-label="Во всю ширину" placeholder="Во всю ширину" />
        <Surface className="w-full rounded-3xl p-6">
          <TextArea
            fullWidth
            aria-label="На поверхности"
            placeholder="На поверхности"
            variant="secondary"
          />
        </Surface>
      </div>
    </Showcase>
  ),
};
