import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Label} from "../label/index.ts";

import {ProgressCircle} from "./index.ts";

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
    <div className="flex items-center gap-6">{children}</div>
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
  component: ProgressCircle,
  parameters: {
    layout: "padded",
  },
  title: "Components/ProgressCircle",
} satisfies Meta<typeof ProgressCircle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Showcase title="Default">
      <ProgressCircle aria-label="Loading" value={60} {...args}>
        <ProgressCircle.Track>
          <ProgressCircle.TrackCircle />
          <ProgressCircle.FillCircle />
        </ProgressCircle.Track>
      </ProgressCircle>
    </Showcase>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <Showcase title="Sizes">
      {SIZES.map(({label, size, value}) => (
        <ProgressCircle key={size} aria-label={label} size={size} value={value} {...args}>
          <ProgressCircle.Track>
            <ProgressCircle.TrackCircle />
            <ProgressCircle.FillCircle />
          </ProgressCircle.Track>
        </ProgressCircle>
      ))}
    </Showcase>
  ),
};

export const Colors: Story = {
  render: (args) => (
    <Showcase title="Colors">
      {COLORS.map((color) => (
        <ProgressCircle key={color} aria-label={color} color={color} value={60} {...args}>
          <ProgressCircle.Track>
            <ProgressCircle.TrackCircle />
            <ProgressCircle.FillCircle />
          </ProgressCircle.Track>
        </ProgressCircle>
      ))}
    </Showcase>
  ),
};

export const Indeterminate: Story = {
  render: (args) => (
    <Showcase title="Indeterminate">
      <ProgressCircle isIndeterminate aria-label="Loading" {...args}>
        <ProgressCircle.Track>
          <ProgressCircle.TrackCircle />
          <ProgressCircle.FillCircle />
        </ProgressCircle.Track>
      </ProgressCircle>
    </Showcase>
  ),
};

export const WithLabel: Story = {
  render: (args) => (
    <Showcase title="With Label">
      <ProgressCircle aria-labelledby="upload-label" value={75} {...args}>
        <ProgressCircle.Track>
          <ProgressCircle.TrackCircle />
          <ProgressCircle.FillCircle />
        </ProgressCircle.Track>
      </ProgressCircle>
      <Label id="upload-label">75% complete</Label>
    </Showcase>
  ),
};
