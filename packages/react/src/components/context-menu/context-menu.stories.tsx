import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

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
          Region
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
