import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Label} from "../label/index.ts";

import {Slider} from "./index.ts";

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
  component: Slider,
  parameters: {
    layout: "padded",
  },
  title: "Components/Slider",
} satisfies Meta<typeof Slider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Showcase title="Default">
      <div className="w-96">
        <Slider defaultValue={30}>
          <Label>Volume</Label>
          <Slider.Output />
          <Slider.Track>
            <Slider.Fill />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>
      </div>
    </Showcase>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Showcase title="Vertical">
      <div className="flex h-96 items-center justify-center">
        <Slider className="h-full" defaultValue={30} orientation="vertical">
          <Label>Volume</Label>
          <Slider.Output />
          <Slider.Track>
            <Slider.Fill />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>
      </div>
    </Showcase>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Showcase title="Disabled">
      <div className="w-96">
        <Slider isDisabled defaultValue={30}>
          <Label>Volume</Label>
          <Slider.Output />
          <Slider.Track>
            <Slider.Fill />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>
      </div>
    </Showcase>
  ),
};

export const Range: Story = {
  render: () => (
    <Showcase title="Range">
      <div className="w-96">
        <Slider
          defaultValue={[100, 500]}
          formatOptions={{style: "currency", currency: "USD"}}
          maxValue={1000}
          minValue={0}
          step={50}
        >
          <Label>Price Range</Label>
          <Slider.Output />
          <Slider.Track>
            {({state}) => (
              <>
                <Slider.Fill />
                {state.values.map((_, i) => (
                  <Slider.Thumb key={i} index={i} />
                ))}
              </>
            )}
          </Slider.Track>
        </Slider>
      </div>
    </Showcase>
  ),
};
