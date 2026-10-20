import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ComponentProps, ReactNode} from "react";

import {ColorSwatchPicker} from "./index.ts";

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

const COLORS = ["#EF4444", "#F59E0B", "#10B981", "#0485F7", "#D946EF", "#FFFFFF"];

const Picker = ({
  isDisabled,
  ...props
}: Partial<ComponentProps<typeof ColorSwatchPicker>> & {isDisabled?: boolean}) => (
  <ColorSwatchPicker aria-label="Palette" defaultValue={COLORS[0]} {...props}>
    {COLORS.map((color) => (
      <ColorSwatchPicker.Item key={color} color={color} isDisabled={isDisabled}>
        <ColorSwatchPicker.Swatch />
        <ColorSwatchPicker.Indicator />
      </ColorSwatchPicker.Item>
    ))}
  </ColorSwatchPicker>
);

const meta = {
  component: ColorSwatchPicker,
  parameters: {
    layout: "padded",
  },
  title: "Components/ColorSwatchPicker",
} satisfies Meta<typeof ColorSwatchPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Showcase title="Default">
      <Picker />
    </Showcase>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Showcase title="Sizes">
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Picker key={size} aria-label={`Palette ${size}`} size={size} />
      ))}
    </Showcase>
  ),
};

export const Square: Story = {
  render: () => (
    <Showcase title="Square">
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Picker key={size} aria-label={`Palette ${size}`} size={size} variant="square" />
      ))}
    </Showcase>
  ),
};

export const Stack: Story = {
  render: () => (
    <Showcase title="Stack">
      <Picker layout="stack" />
    </Showcase>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Showcase title="Disabled">
      <Picker isDisabled />
    </Showcase>
  ),
};
