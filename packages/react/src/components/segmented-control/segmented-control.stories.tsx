import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {SegmentedControl} from "./index.ts";

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
  component: SegmentedControl,
  parameters: {
    layout: "padded",
  },
  title: "Components/SegmentedControl",
} satisfies Meta<typeof SegmentedControl>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    "aria-label": "Вид",
    children: (
      <>
        <SegmentedControl.Item id="grid">Сетка</SegmentedControl.Item>
        <SegmentedControl.Item id="list">Список</SegmentedControl.Item>
        <SegmentedControl.Item id="table">Таблица</SegmentedControl.Item>
      </>
    ),
    defaultSelectedKey: "grid",
  },
  render: (args) => (
    <Showcase title="Default">
      <SegmentedControl {...args} />
    </Showcase>
  ),
};

/*
 * Deliberately uneven labels. This story is the instrument for the segment-width rule: the shell
 * must hug its content, the segments must come out equal, and the longest label must not be
 * clipped. The second control is the same set inside a narrow box, which is where a `w-full`
 * consumer lands.
 */
export const LongLabels: Story = {
  args: {
    "aria-label": "Период",
    children: (
      <>
        <SegmentedControl.Item id="day">Day</SegmentedControl.Item>
        <SegmentedControl.Item id="week">Week</SegmentedControl.Item>
        <SegmentedControl.Item id="year">Last 12 months</SegmentedControl.Item>
        <SegmentedControl.Item id="all">All</SegmentedControl.Item>
      </>
    ),
    defaultSelectedKey: "day",
  },
  render: (args) => (
    <Showcase title="LongLabels">
      <div className="flex flex-col items-start gap-6">
        <SegmentedControl {...args} data-testid="hug" />
        <div className="w-80">
          <SegmentedControl {...args} className="w-full" data-testid="stretched" />
        </div>
      </div>
    </Showcase>
  ),
};
