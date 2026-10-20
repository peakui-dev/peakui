import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {ColorField} from "../color-field/index.ts";
import {ColorSwatch} from "../color-swatch/index.ts";

import {ColorInputGroup} from "./index.ts";

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
  component: ColorInputGroup,
  parameters: {
    layout: "padded",
  },
  title: "Components/ColorInputGroup",
} satisfies Meta<typeof ColorInputGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Showcase title="Default">
      <ColorField aria-label="Colour" defaultValue="#0485F7">
        <ColorInputGroup>
          <ColorInputGroup.Prefix>
            <ColorSwatch aria-label="Current colour" size="xs" />
          </ColorInputGroup.Prefix>
          <ColorInputGroup.Input />
        </ColorInputGroup>
      </ColorField>
    </Showcase>
  ),
};

export const Secondary: Story = {
  render: () => (
    <Showcase title="Secondary">
      <ColorField aria-label="Colour" defaultValue="#0485F7">
        <ColorInputGroup variant="secondary">
          <ColorInputGroup.Prefix>
            <ColorSwatch aria-label="Current colour" size="xs" />
          </ColorInputGroup.Prefix>
          <ColorInputGroup.Input />
        </ColorInputGroup>
      </ColorField>
    </Showcase>
  ),
};

export const WithSuffix: Story = {
  render: () => (
    <Showcase title="With a suffix">
      <ColorField aria-label="Colour" defaultValue="#0485F7">
        <ColorInputGroup>
          <ColorInputGroup.Input />
          <ColorInputGroup.Suffix>hex</ColorInputGroup.Suffix>
        </ColorInputGroup>
      </ColorField>
    </Showcase>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <Showcase title="Full width">
      <ColorField fullWidth aria-label="Colour" defaultValue="#0485F7">
        <ColorInputGroup fullWidth>
          <ColorInputGroup.Prefix>
            <ColorSwatch aria-label="Current colour" size="xs" />
          </ColorInputGroup.Prefix>
          <ColorInputGroup.Input />
        </ColorInputGroup>
      </ColorField>
    </Showcase>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Showcase title="Disabled">
      <ColorField isDisabled aria-label="Colour" defaultValue="#0485F7">
        <ColorInputGroup>
          <ColorInputGroup.Prefix>
            <ColorSwatch aria-label="Current colour" size="xs" />
          </ColorInputGroup.Prefix>
          <ColorInputGroup.Input />
        </ColorInputGroup>
      </ColorField>
    </Showcase>
  ),
};
