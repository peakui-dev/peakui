import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {ColorArea} from "./index.ts";

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
  component: ColorArea,
  parameters: {
    layout: "padded",
  },
  title: "Components/ColorArea",
} satisfies Meta<typeof ColorArea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Showcase title="Default">
      <ColorArea
        aria-label="Saturation and brightness"
        colorSpace="hsb"
        defaultValue="hsb(210, 100%, 100%)"
        xChannel="saturation"
        yChannel="brightness"
      >
        <ColorArea.Thumb />
      </ColorArea>
    </Showcase>
  ),
};

export const WithDots: Story = {
  render: () => (
    <Showcase title="With dots">
      <ColorArea
        showDots
        aria-label="Saturation and brightness"
        colorSpace="hsb"
        defaultValue="hsb(340, 80%, 90%)"
        xChannel="saturation"
        yChannel="brightness"
      >
        <ColorArea.Thumb />
      </ColorArea>
    </Showcase>
  ),
};

export const RGBChannels: Story = {
  render: () => (
    <Showcase title="RGB channels">
      <ColorArea
        aria-label="Red and green"
        colorSpace="rgb"
        defaultValue="rgb(120, 200, 80)"
        xChannel="red"
        yChannel="green"
      >
        <ColorArea.Thumb />
      </ColorArea>
    </Showcase>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Showcase title="Disabled">
      <ColorArea
        isDisabled
        aria-label="Saturation and brightness"
        colorSpace="hsb"
        defaultValue="hsb(210, 100%, 100%)"
        xChannel="saturation"
        yChannel="brightness"
      >
        <ColorArea.Thumb />
      </ColorArea>
    </Showcase>
  ),
};
