import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Label} from "../label/index.ts";

import {ColorSlider} from "./index.ts";

/*
 * Every story carries a level-two heading: the audit in apps/storybook/e2e waits for it as the
 * sign that the preview is ready, and without it axe runs against an empty iframe and passes.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex w-72 flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    {children}
  </div>
);

const meta = {
  args: {channel: "hue"},
  component: ColorSlider,
  parameters: {
    layout: "padded",
  },
  title: "Components/ColorSlider",
} satisfies Meta<typeof ColorSlider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Showcase title="Default">
      <ColorSlider channel="hue" colorSpace="hsb" defaultValue="hsb(210, 100%, 100%)">
        <Label>Hue</Label>
        <ColorSlider.Output />
        <ColorSlider.Track>
          <ColorSlider.Thumb />
        </ColorSlider.Track>
      </ColorSlider>
    </Showcase>
  ),
};

export const WithoutLabel: Story = {
  render: () => (
    <Showcase title="Without label or output">
      <ColorSlider
        aria-label="Hue"
        channel="hue"
        colorSpace="hsb"
        defaultValue="hsb(210, 100%, 100%)"
      >
        <ColorSlider.Track>
          <ColorSlider.Thumb />
        </ColorSlider.Track>
      </ColorSlider>
    </Showcase>
  ),
};

export const Alpha: Story = {
  render: () => (
    <Showcase title="Alpha">
      <ColorSlider channel="alpha" defaultValue="hsb(210, 100%, 100%)">
        <Label>Opacity</Label>
        <ColorSlider.Output />
        <ColorSlider.Track>
          <ColorSlider.Thumb />
        </ColorSlider.Track>
      </ColorSlider>
    </Showcase>
  ),
};

export const RGB: Story = {
  render: () => (
    <Showcase title="RGB">
      <ColorSlider channel="red" colorSpace="rgb" defaultValue="rgb(120, 200, 80)">
        <Label>Red</Label>
        <ColorSlider.Output />
        <ColorSlider.Track>
          <ColorSlider.Thumb />
        </ColorSlider.Track>
      </ColorSlider>
    </Showcase>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Showcase title="Vertical">
      <div className="h-48">
        <ColorSlider
          channel="hue"
          colorSpace="hsb"
          defaultValue="hsb(210, 100%, 100%)"
          orientation="vertical"
        >
          <Label>Hue</Label>
          <ColorSlider.Output />
          <ColorSlider.Track>
            <ColorSlider.Thumb />
          </ColorSlider.Track>
        </ColorSlider>
      </div>
    </Showcase>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Showcase title="Disabled">
      <ColorSlider isDisabled channel="hue" colorSpace="hsb" defaultValue="hsb(210, 100%, 100%)">
        <Label>Hue</Label>
        <ColorSlider.Output />
        <ColorSlider.Track>
          <ColorSlider.Thumb />
        </ColorSlider.Track>
      </ColorSlider>
    </Showcase>
  ),
};
