import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";
import type {Key} from "react-aria-components/Collection";

import {useState} from "react";

import {IconMinus, IconPlus, IconSearch} from "../icons.tsx";

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

const views = (
  <>
    <SegmentedControl.Item id="grid">Grid</SegmentedControl.Item>
    <SegmentedControl.Item id="list">List</SegmentedControl.Item>
    <SegmentedControl.Item id="table">Table</SegmentedControl.Item>
  </>
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

export const Basic: Story = {
  args: {
    "aria-label": "View",
    children: views,
    defaultSelectedKey: "grid",
  },
  render: (args) => (
    <Showcase title="Basic">
      <SegmentedControl {...args} />
    </Showcase>
  ),
};

/*
 * Icon-only segments. The core ships no theme icons, and a story may not import from apps/docs, so
 * this is a zoom control — the geometry it demonstrates is the same one a theme switcher uses.
 * `isIconOnly` squares the segment so the capsule reads as a circle, and each segment needs its own
 * label, since an icon carries no accessible name.
 */
export const IconOnly: Story = {
  args: {
    "aria-label": "Zoom",
    children: (
      <>
        <SegmentedControl.Item isIconOnly aria-label="Zoom out" id="out">
          <IconMinus />
        </SegmentedControl.Item>
        <SegmentedControl.Item isIconOnly aria-label="Fit" id="fit">
          <IconSearch />
        </SegmentedControl.Item>
        <SegmentedControl.Item isIconOnly aria-label="Zoom in" id="in">
          <IconPlus />
        </SegmentedControl.Item>
      </>
    ),
    defaultSelectedKey: "fit",
  },
  render: (args) => (
    <Showcase title="IconOnly">
      <SegmentedControl {...args} />
    </Showcase>
  ),
};

/* The three sizes stacked, so the scale is comparable at a glance. */
export const Sizes: Story = {
  args: {
    "aria-label": "View",
    children: views,
    defaultSelectedKey: "grid",
  },
  render: (args) => (
    <Showcase title="Sizes">
      <div className="flex flex-col items-start gap-4">
        {(["sm", "md", "lg"] as const).map((size) => (
          <SegmentedControl key={size} {...args} aria-label={`View ${size}`} size={size} />
        ))}
      </div>
    </Showcase>
  ),
};

export const Disabled: Story = {
  args: {
    "aria-label": "View",
    children: views,
    defaultSelectedKey: "grid",
  },
  render: (args) => (
    <Showcase title="Disabled">
      <div className="flex flex-col items-start gap-4">
        <SegmentedControl {...args} isDisabled aria-label="Whole control disabled" />
        <SegmentedControl aria-label="One segment disabled" defaultSelectedKey="grid">
          <SegmentedControl.Item id="grid">Grid</SegmentedControl.Item>
          <SegmentedControl.Item isDisabled id="list">
            List
          </SegmentedControl.Item>
          <SegmentedControl.Item id="table">Table</SegmentedControl.Item>
        </SegmentedControl>
      </div>
    </Showcase>
  ),
};

/* Controlled: proves the handler hands over a single key, not a Set. */
export const Controlled: Story = {
  args: {
    "aria-label": "View",
    children: views,
  },
  render: () => {
    const [view, setView] = useState<Key>("grid");

    return (
      <Showcase title="Controlled">
        <div className="flex flex-col items-start gap-4">
          <SegmentedControl aria-label="View" selectedKey={view} onSelectionChange={setView}>
            {views}
          </SegmentedControl>
          <p className="text-sm text-muted">Selected: {String(view)}</p>
        </div>
      </Showcase>
    );
  },
};

/*
 * Deliberately uneven labels. This story is the instrument for the segment-width rule: the shell
 * must hug its content, the longest label must not be clipped, and a stretched control must share
 * its width equally. The measurement it produced is recorded in segmented-control.css.
 */
export const LongLabels: Story = {
  args: {
    "aria-label": "Period",
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
