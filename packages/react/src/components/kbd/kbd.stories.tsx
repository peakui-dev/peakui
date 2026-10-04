import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Kbd} from "./index.ts";

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

/*
 * Labelled row: the shape every shortcut listing composes — a caption beside the key sequence.
 */
const Row = ({children, label}: {children: ReactNode; label: string}) => (
  <div className="flex items-center gap-2">
    <span>{label}:</span>
    {children}
  </div>
);

const meta = {
  component: Kbd,
  parameters: {
    layout: "padded",
  },
  title: "Components/Kbd",
} satisfies Meta<typeof Kbd>;

export default meta;

/*
 * Kbd has required children, and strict CSF typing then demands `args` on every render-only
 * story. `children: null` satisfies the requirement; each story's `render` composes its own keys.
 */
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {children: null},
  render: () => (
    <Showcase title="Default">
      <Kbd>
        <Kbd.Abbr keyValue="command" />
        <Kbd.Content>K</Kbd.Content>
      </Kbd>
    </Showcase>
  ),
};

export const WithMultipleKeys: Story = {
  args: {children: null},
  render: () => (
    <Showcase title="With Multiple Keys">
      <Kbd>
        <Kbd.Abbr keyValue="command" />
        <Kbd.Abbr keyValue="shift" />
        <Kbd.Content>K</Kbd.Content>
      </Kbd>
    </Showcase>
  ),
};

export const KeyCombinations: Story = {
  args: {children: null},
  render: () => (
    <Showcase title="Key Combinations">
      <div className="flex flex-col gap-4">
        <Row label="Copy">
          <Kbd>
            <Kbd.Abbr keyValue="command" />
            <Kbd.Content>C</Kbd.Content>
          </Kbd>
        </Row>
        <Row label="Paste">
          <Kbd>
            <Kbd.Abbr keyValue="command" />
            <Kbd.Content>V</Kbd.Content>
          </Kbd>
        </Row>
        <Row label="Cut">
          <Kbd>
            <Kbd.Abbr keyValue="command" />
            <Kbd.Content>X</Kbd.Content>
          </Kbd>
        </Row>
        <Row label="Undo">
          <Kbd>
            <Kbd.Abbr keyValue="command" />
            <Kbd.Content>Z</Kbd.Content>
          </Kbd>
        </Row>
        <Row label="Redo">
          <Kbd>
            <Kbd.Abbr keyValue="command" />
            <Kbd.Abbr keyValue="shift" />
            <Kbd.Content>Z</Kbd.Content>
          </Kbd>
        </Row>
      </div>
    </Showcase>
  ),
};

export const LightVariant: Story = {
  args: {children: null},
  render: () => (
    <Showcase title="Light Variant">
      <div className="flex flex-col gap-4">
        <Row label="Copy">
          <Kbd variant="light">
            <Kbd.Abbr keyValue="command" />
            <Kbd.Content>C</Kbd.Content>
          </Kbd>
        </Row>
        <Row label="Paste">
          <Kbd variant="light">
            <Kbd.Abbr keyValue="command" />
            <Kbd.Content>V</Kbd.Content>
          </Kbd>
        </Row>
        <Row label="Cut">
          <Kbd variant="light">
            <Kbd.Abbr keyValue="command" />
            <Kbd.Content>X</Kbd.Content>
          </Kbd>
        </Row>
        <Row label="Undo">
          <Kbd variant="light">
            <Kbd.Abbr keyValue="command" />
            <Kbd.Content>Z</Kbd.Content>
          </Kbd>
        </Row>
        <Row label="Redo">
          <Kbd variant="light">
            <Kbd.Abbr keyValue="command" />
            <Kbd.Abbr keyValue="shift" />
            <Kbd.Content>Z</Kbd.Content>
          </Kbd>
        </Row>
      </div>
    </Showcase>
  ),
};

export const NavigationKeys: Story = {
  args: {children: null},
  render: () => (
    <Showcase title="Navigation Keys">
      <div className="flex items-center gap-4">
        <Kbd>
          <Kbd.Abbr keyValue="up" />
        </Kbd>
        <Kbd>
          <Kbd.Abbr keyValue="down" />
        </Kbd>
        <Kbd>
          <Kbd.Abbr keyValue="left" />
        </Kbd>
        <Kbd>
          <Kbd.Abbr keyValue="right" />
        </Kbd>
      </div>
    </Showcase>
  ),
};

export const SpecialKeys: Story = {
  args: {children: null},
  render: () => (
    <Showcase title="Special Keys">
      <div className="grid grid-cols-4 gap-4">
        <Kbd>
          <Kbd.Abbr keyValue="enter" />
        </Kbd>
        <Kbd>
          <Kbd.Abbr keyValue="delete" />
        </Kbd>
        <Kbd>
          <Kbd.Abbr keyValue="escape" />
        </Kbd>
        <Kbd>
          <Kbd.Abbr keyValue="tab" />
        </Kbd>
        <Kbd>
          <Kbd.Abbr keyValue="capslock" />
        </Kbd>
        <Kbd>
          <Kbd.Abbr keyValue="space" />
        </Kbd>
        <Kbd>
          <Kbd.Abbr keyValue="pageup" />
        </Kbd>
        <Kbd>
          <Kbd.Abbr keyValue="pagedown" />
        </Kbd>
        <Kbd>
          <Kbd.Abbr keyValue="home" />
        </Kbd>
        <Kbd>
          <Kbd.Abbr keyValue="end" />
        </Kbd>
        <Kbd>
          <Kbd.Abbr keyValue="help" />
        </Kbd>
        <Kbd>
          <Kbd.Abbr keyValue="fn" />
        </Kbd>
      </div>
    </Showcase>
  ),
};

export const ComplexShortcuts: Story = {
  args: {children: null},
  render: () => (
    <Showcase title="Complex Shortcuts">
      <div className="flex flex-col gap-4">
        <Row label="Open Spotlight">
          <Kbd>
            <Kbd.Abbr keyValue="command" />
            <Kbd.Abbr keyValue="space" />
          </Kbd>
        </Row>
        <Row label="Force Quit">
          <Kbd>
            <Kbd.Abbr keyValue="command" />
            <Kbd.Abbr keyValue="option" />
            <Kbd.Abbr keyValue="escape" />
          </Kbd>
        </Row>
        <Row label="Screenshot">
          <Kbd>
            <Kbd.Abbr keyValue="command" />
            <Kbd.Abbr keyValue="shift" />
            <Kbd.Content>3</Kbd.Content>
          </Kbd>
        </Row>
        <Row label="Switch Apps">
          <Kbd>
            <Kbd.Abbr keyValue="command" />
            <Kbd.Abbr keyValue="tab" />
          </Kbd>
        </Row>
      </div>
    </Showcase>
  ),
};

export const InlineUsage: Story = {
  args: {children: null},
  render: () => (
    <Showcase title="Inline Usage">
      <div className="space-y-2">
        <p className="text-sm">
          Press{" "}
          <Kbd>
            <Kbd.Content>Esc</Kbd.Content>
          </Kbd>{" "}
          to close the dialog.
        </p>
        <p className="text-sm">
          Use{" "}
          <Kbd>
            <Kbd.Abbr keyValue="command" />
            <Kbd.Content>K</Kbd.Content>
          </Kbd>{" "}
          to open the command palette.
        </p>
        <p className="text-sm">
          Navigate with{" "}
          <Kbd>
            <Kbd.Abbr keyValue="up" />
          </Kbd>{" "}
          and{" "}
          <Kbd>
            <Kbd.Abbr keyValue="down" />
          </Kbd>{" "}
          arrow keys.
        </p>
      </div>
    </Showcase>
  ),
};

export const CustomContent: Story = {
  args: {children: null},
  render: () => (
    <Showcase title="Custom Content">
      <div className="flex flex-col gap-4">
        <Row label="Select word">
          <Kbd>
            <Kbd.Abbr keyValue="option" />
            <Kbd.Abbr keyValue="left" />
          </Kbd>
        </Row>
        <Row label="Delete line">
          <Kbd>
            <Kbd.Abbr keyValue="ctrl" />
            <Kbd.Content>K</Kbd.Content>
          </Kbd>
        </Row>
        <Row label="Multiple modifiers">
          <Kbd>
            <Kbd.Abbr keyValue="command" />
            <Kbd.Abbr keyValue="option" />
            <Kbd.Abbr keyValue="shift" />
            <Kbd.Content>4</Kbd.Content>
          </Kbd>
        </Row>
      </div>
    </Showcase>
  ),
};
