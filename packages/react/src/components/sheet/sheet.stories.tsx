import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Sheet} from "./index.ts";

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
  component: Sheet,
  parameters: {
    layout: "padded",
  },
  title: "Components/Sheet",
} satisfies Meta<typeof Sheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Showcase title="Default">
      <Sheet>Sheet</Sheet>
    </Showcase>
  ),
};
