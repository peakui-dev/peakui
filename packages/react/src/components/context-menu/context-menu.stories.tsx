import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import React from "react";

import {Button} from "../button/index.ts";
import {Dropdown} from "../dropdown/index.ts";
import {Label} from "../label/index.ts";

import {ContextMenu} from "./index.ts";

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
  component: ContextMenu,
  parameters: {
    layout: "padded",
  },
  title: "Components/ContextMenu",
} satisfies Meta<typeof ContextMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Showcase title="Default">
      <ContextMenu>
        <ContextMenu.Trigger className="rounded-lg border border-dashed p-12">
          Right-click this region
        </ContextMenu.Trigger>
        <ContextMenu.Popover>
          <ContextMenu.Menu aria-label="Actions">
            <ContextMenu.Item id="copy" textValue="Copy">
              <Label>Copy</Label>
            </ContextMenu.Item>
            <ContextMenu.Item id="paste" textValue="Paste">
              <Label>Paste</Label>
            </ContextMenu.Item>
          </ContextMenu.Menu>
        </ContextMenu.Popover>
      </ContextMenu>
      <div className="flex flex-col items-start gap-2">
        <Dropdown>
          <Button aria-label="Actions menu" variant="secondary">
            Actions
          </Button>
          <Dropdown.Popover>
            <Dropdown.Menu>
              <Dropdown.Item id="copy" textValue="Copy">
                <Label>Copy</Label>
              </Dropdown.Item>
              <Dropdown.Item id="paste" textValue="Paste">
                <Label>Paste</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
        <p className="text-sm text-muted">
          A context menu must never be the only path to an action: every action here is also
          reachable from the visible menu above.
        </p>
      </div>
    </Showcase>
  ),
};

export const WithSections: Story = {
  render: () => (
    <Showcase title="With sections">
      <ContextMenu>
        <ContextMenu.Trigger className="rounded-lg border border-dashed p-12">
          Right-click this region
        </ContextMenu.Trigger>
        <ContextMenu.Popover>
          <ContextMenu.Menu aria-label="Actions">
            <ContextMenu.Section aria-label="Edit">
              <ContextMenu.Item id="copy" textValue="Copy">
                <Label>Copy</Label>
              </ContextMenu.Item>
              <ContextMenu.Item id="paste" textValue="Paste">
                <Label>Paste</Label>
              </ContextMenu.Item>
            </ContextMenu.Section>
            <ContextMenu.Section aria-label="Danger zone">
              <ContextMenu.Item id="delete" textValue="Delete" variant="danger">
                <Label>Delete</Label>
              </ContextMenu.Item>
            </ContextMenu.Section>
          </ContextMenu.Menu>
        </ContextMenu.Popover>
      </ContextMenu>
    </Showcase>
  ),
};

export const WithNativeEscape: Story = {
  render: () => (
    <Showcase title="With native escape">
      <ContextMenu>
        <ContextMenu.Trigger
          aria-label="Region with a link"
          className="flex flex-col gap-3 rounded-lg border border-dashed p-12"
          role="group"
        >
          <span>Right-click here for the custom menu.</span>
          <a data-context-menu-native className="underline" href="https://example.com">
            Right-click this link for the browser menu
          </a>
        </ContextMenu.Trigger>
        <ContextMenu.Popover>
          <ContextMenu.Menu aria-label="Actions">
            <ContextMenu.Item id="copy" textValue="Copy">
              <Label>Copy</Label>
            </ContextMenu.Item>
            <ContextMenu.Item id="paste" textValue="Paste">
              <Label>Paste</Label>
            </ContextMenu.Item>
          </ContextMenu.Menu>
        </ContextMenu.Popover>
      </ContextMenu>
    </Showcase>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Showcase title="Disabled">
      <ContextMenu isDisabled>
        <ContextMenu.Trigger className="rounded-lg border border-dashed p-12">
          Right-click this region: the browser menu stays
        </ContextMenu.Trigger>
        <ContextMenu.Popover>
          <ContextMenu.Menu aria-label="Actions">
            <ContextMenu.Item id="copy" textValue="Copy">
              <Label>Copy</Label>
            </ContextMenu.Item>
          </ContextMenu.Menu>
        </ContextMenu.Popover>
      </ContextMenu>
    </Showcase>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [isOpen, setOpen] = React.useState(false);

    return (
      <Showcase title="Controlled">
        <div className="flex flex-col items-start gap-4">
          <p className="text-sm text-muted">
            Menu: <strong>{isOpen ? "open" : "closed"}</strong>
          </p>
          <Button variant="secondary" onPress={() => setOpen((current) => !current)}>
            Toggle menu
          </Button>
          <ContextMenu isOpen={isOpen} onOpenChange={setOpen}>
            <ContextMenu.Trigger className="rounded-lg border border-dashed p-12">
              Right-click this region
            </ContextMenu.Trigger>
            <ContextMenu.Popover>
              <ContextMenu.Menu aria-label="Actions">
                <ContextMenu.Item id="copy" textValue="Copy">
                  <Label>Copy</Label>
                </ContextMenu.Item>
                <ContextMenu.Item id="paste" textValue="Paste">
                  <Label>Paste</Label>
                </ContextMenu.Item>
              </ContextMenu.Menu>
            </ContextMenu.Popover>
          </ContextMenu>
        </div>
      </Showcase>
    );
  },
};

export const NearViewportEdge: Story = {
  parameters: {
    layout: "fullscreen",
  },
  render: () => (
    <Showcase title="Near viewport edge">
      <ContextMenu>
        <ContextMenu.Trigger className="fixed right-4 bottom-4 rounded-lg border border-dashed p-8">
          Right-click this region
        </ContextMenu.Trigger>
        <ContextMenu.Popover>
          <ContextMenu.Menu aria-label="Actions">
            <ContextMenu.Item id="copy" textValue="Copy">
              <Label>Copy</Label>
            </ContextMenu.Item>
            <ContextMenu.Item id="paste" textValue="Paste">
              <Label>Paste</Label>
            </ContextMenu.Item>
            <ContextMenu.Item id="delete" textValue="Delete" variant="danger">
              <Label>Delete</Label>
            </ContextMenu.Item>
          </ContextMenu.Menu>
        </ContextMenu.Popover>
      </ContextMenu>
    </Showcase>
  ),
};
