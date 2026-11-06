import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Label} from "../label/index.ts";

import {Menu} from "./index.ts";

/*
 * Every story carries a level-two heading: the audit in apps/storybook/e2e waits for it as the
 * sign that the preview is ready, and without it axe runs against an empty iframe and passes.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    <div className="w-60">{children}</div>
  </div>
);

const meta = {
  component: Menu,
  parameters: {
    layout: "padded",
  },
  title: "Components/Menu",
} satisfies Meta<typeof Menu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Showcase title="Default">
      <Menu aria-label="Actions">
        <Menu.Item id="new" textValue="New file">
          <Label>New file</Label>
        </Menu.Item>
        <Menu.Item id="open" textValue="Open">
          <Label>Open</Label>
        </Menu.Item>
        <Menu.Item id="rename" textValue="Rename">
          <Label>Rename</Label>
        </Menu.Item>
      </Menu>
    </Showcase>
  ),
};

export const WithSections: Story = {
  render: () => (
    <Showcase title="With sections">
      <Menu aria-label="Actions">
        <Menu.Section aria-label="File">
          <Menu.Item id="new" textValue="New file">
            <Label>New file</Label>
          </Menu.Item>
          <Menu.Item id="open" textValue="Open">
            <Label>Open</Label>
          </Menu.Item>
        </Menu.Section>
        <Menu.Section aria-label="Danger zone">
          <Menu.Item id="delete" textValue="Delete" variant="danger">
            <Label>Delete</Label>
          </Menu.Item>
        </Menu.Section>
      </Menu>
    </Showcase>
  ),
};

export const WithSelection: Story = {
  render: () => (
    <Showcase title="With selection">
      <Menu aria-label="Text style" defaultSelectedKeys={["bold"]} selectionMode="multiple">
        <Menu.Item id="bold" textValue="Bold">
          <Label>Bold</Label>
          <Menu.ItemIndicator />
        </Menu.Item>
        <Menu.Item id="italic" textValue="Italic">
          <Label>Italic</Label>
          <Menu.ItemIndicator />
        </Menu.Item>
        <Menu.Item id="underline" textValue="Underline">
          <Label>Underline</Label>
          <Menu.ItemIndicator />
        </Menu.Item>
      </Menu>
    </Showcase>
  ),
};

export const WithDisabledItems: Story = {
  render: () => (
    <Showcase title="With disabled items">
      <Menu aria-label="Actions" disabledKeys={["open"]}>
        <Menu.Item id="new" textValue="New file">
          <Label>New file</Label>
        </Menu.Item>
        <Menu.Item id="open" textValue="Open">
          <Label>Open</Label>
        </Menu.Item>
        <Menu.Item id="rename" textValue="Rename">
          <Label>Rename</Label>
        </Menu.Item>
      </Menu>
    </Showcase>
  ),
};
