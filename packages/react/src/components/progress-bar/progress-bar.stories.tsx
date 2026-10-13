import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Label} from "../label/index.ts";

import {ProgressBar} from "./index.ts";

const SIZES = [
  {label: "Small", size: "sm", value: 40},
  {label: "Medium", size: "md", value: 60},
  {label: "Large", size: "lg", value: 80},
] as const;
const COLORS = ["default", "accent", "success", "warning", "danger"] as const;

/*
 * Every story carries a level-two heading: the audit in apps/storybook/e2e waits for it as the
 * sign that the preview is ready, and without it axe runs against an empty iframe and passes.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    <div className="w-96">{children}</div>
  </div>
);

const meta = {
  argTypes: {
    color: {
      control: "select",
      options: ["default", "accent", "success", "warning", "danger"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
  component: ProgressBar,
  parameters: {
    layout: "padded",
  },
  title: "Components/ProgressBar",
} satisfies Meta<typeof ProgressBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Showcase title="Default">
      <ProgressBar value={60} {...args}>
        <Label>Loading</Label>
        <ProgressBar.Output />
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
    </Showcase>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <Showcase title="Sizes">
      <div className="flex w-full flex-col gap-6">
        {SIZES.map(({label, size, value}) => (
          <ProgressBar key={size} size={size} value={value} {...args}>
            <Label>{label}</Label>
            <ProgressBar.Output />
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
        ))}
      </div>
    </Showcase>
  ),
};

export const Colors: Story = {
  render: (args) => (
    <Showcase title="Colors">
      <div className="flex w-full flex-col gap-6">
        {COLORS.map((color) => (
          <ProgressBar key={color} color={color} value={50} {...args}>
            <Label className="capitalize">{color}</Label>
            <ProgressBar.Output />
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
        ))}
      </div>
    </Showcase>
  ),
};

export const Indeterminate: Story = {
  render: (args) => (
    <Showcase title="Indeterminate">
      <ProgressBar isIndeterminate {...args}>
        <Label>Loading...</Label>
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
    </Showcase>
  ),
};

export const CustomValue: Story = {
  render: (args) => (
    <Showcase title="Custom Value">
      <ProgressBar
        formatOptions={{currency: "USD", style: "currency"}}
        maxValue={1000}
        minValue={0}
        value={750}
        {...args}
      >
        <Label>Revenue</Label>
        <ProgressBar.Output />
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
    </Showcase>
  ),
};

export const WithoutLabel: Story = {
  render: (args) => (
    <Showcase title="Without Label">
      <ProgressBar aria-label="Loading progress" value={45} {...args}>
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
    </Showcase>
  ),
};
