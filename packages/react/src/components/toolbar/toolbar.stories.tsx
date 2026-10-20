import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Button} from "../button/index.ts";
import {ButtonGroup} from "../button-group/index.ts";
import {Separator} from "../separator/index.ts";
import {ToggleButton} from "../toggle-button/index.ts";
import {ToggleButtonGroup} from "../toggle-button-group/index.ts";

import {Toolbar} from "./index.ts";

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

const TextStyle = () => (
  <ToggleButtonGroup aria-label="Text style" selectionMode="multiple">
    <ToggleButton aria-label="Bold" id="bold">
      B
    </ToggleButton>
    <ToggleButton aria-label="Italic" id="italic">
      <ToggleButtonGroup.Separator />I
    </ToggleButton>
    <ToggleButton aria-label="Underline" id="underline">
      <ToggleButtonGroup.Separator />U
    </ToggleButton>
  </ToggleButtonGroup>
);

const Clipboard = () => (
  <ButtonGroup>
    <Button variant="secondary">Copy</Button>
    <Button variant="secondary">
      <ButtonGroup.Separator />
      Cut
    </Button>
  </ButtonGroup>
);

const meta = {
  argTypes: {
    orientation: {control: "select", options: ["horizontal", "vertical"]},
  },
  component: Toolbar,
  parameters: {
    layout: "padded",
  },
  title: "Components/Toolbar",
} satisfies Meta<typeof Toolbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Showcase title="Default">
      <Toolbar aria-label="Text formatting">
        <TextStyle />
        <Separator />
        <Clipboard />
      </Toolbar>
    </Showcase>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Showcase title="Vertical">
      <Toolbar aria-label="Tools" orientation="vertical">
        <TextStyle />
        <Separator />
        <ButtonGroup>
          <Button variant="secondary">Undo</Button>
          <Button variant="secondary">
            <ButtonGroup.Separator />
            Redo
          </Button>
        </ButtonGroup>
      </Toolbar>
    </Showcase>
  ),
};

export const WithButtonGroups: Story = {
  render: () => (
    <Showcase title="With button groups">
      <Toolbar aria-label="Editor toolbar">
        <ButtonGroup>
          <Button variant="secondary">Undo</Button>
          <Button variant="secondary">
            <ButtonGroup.Separator />
            Redo
          </Button>
        </ButtonGroup>
        <Separator />
        <TextStyle />
        <Separator />
        <ButtonGroup>
          <Button variant="secondary">Left</Button>
          <Button variant="secondary">
            <ButtonGroup.Separator />
            Center
          </Button>
          <Button variant="secondary">
            <ButtonGroup.Separator />
            Right
          </Button>
        </ButtonGroup>
      </Toolbar>
    </Showcase>
  ),
};

export const Attached: Story = {
  render: () => (
    <Showcase title="Attached">
      <Toolbar isAttached aria-label="Attached toolbar">
        <TextStyle />
        <Separator />
        <Clipboard />
      </Toolbar>
    </Showcase>
  ),
};
