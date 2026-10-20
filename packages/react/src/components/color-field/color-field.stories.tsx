import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Input} from "react-aria-components/Input";

import {ColorInputGroup} from "../color-input-group/index.ts";
import {ColorSwatch} from "../color-swatch/index.ts";
import {FieldError} from "../field-error/index.ts";
import {Label} from "../label/index.ts";

import {ColorField} from "./index.ts";

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
  component: ColorField,
  parameters: {
    layout: "padded",
  },
  title: "Components/ColorField",
} satisfies Meta<typeof ColorField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Showcase title="Default">
      <ColorField defaultValue="#0485F7">
        <Label>Colour</Label>
        <ColorInputGroup>
          <ColorInputGroup.Input />
        </ColorInputGroup>
      </ColorField>
    </Showcase>
  ),
};

export const WithSwatch: Story = {
  render: () => (
    <Showcase title="With a swatch prefix">
      <ColorField defaultValue="#0485F7">
        <Label>Colour</Label>
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

export const Invalid: Story = {
  render: () => (
    <Showcase title="Invalid">
      <ColorField isInvalid defaultValue="#0485F7">
        <Label>Colour</Label>
        <ColorInputGroup>
          <ColorInputGroup.Input />
        </ColorInputGroup>
        <FieldError>Pick a colour from the brand palette.</FieldError>
      </ColorField>
    </Showcase>
  ),
};

export const BareInput: Story = {
  render: () => (
    <Showcase title="Bare input">
      <ColorField aria-label="Colour" defaultValue="#0485F7">
        <Input />
      </ColorField>
    </Showcase>
  ),
};
