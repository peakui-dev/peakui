import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Avatar} from "../avatar/index.ts";

import {Badge} from "./index.ts";

const COLORS = ["default", "accent", "success", "warning", "danger"] as const;
const VARIANTS = ["primary", "secondary", "soft"] as const;
const SIZES = ["sm", "md", "lg"] as const;
const PLACEMENTS = ["top-right", "top-left", "bottom-right", "bottom-left"] as const;

/*
 * Every story carries a level-two heading: the audit in apps/storybook/e2e waits for it as the
 * sign that the preview is ready, and without it axe runs against an empty iframe and passes.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-6 bg-background p-8">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    <div className="flex flex-wrap items-center gap-8">{children}</div>
  </div>
);

const Person = ({initials}: {initials: string}) => (
  <Avatar>
    <Avatar.Fallback>{initials}</Avatar.Fallback>
  </Avatar>
);

const meta = {
  argTypes: {
    color: {control: "select", options: COLORS},
    placement: {control: "select", options: PLACEMENTS},
    size: {control: "select", options: SIZES},
    variant: {control: "select", options: VARIANTS},
  },
  component: Badge,
  parameters: {layout: "padded"},
  title: "Components/Badge",
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Showcase title="Default">
      <Badge.Anchor>
        <Person initials="JD" />
        <Badge {...args}>5</Badge>
      </Badge.Anchor>
    </Showcase>
  ),
};

export const Placements: Story = {
  render: (args) => (
    <Showcase title="Placements">
      {PLACEMENTS.map((placement) => (
        <Badge.Anchor key={placement}>
          <Person initials="JD" />
          <Badge placement={placement} {...args}>
            1
          </Badge>
        </Badge.Anchor>
      ))}
    </Showcase>
  ),
};

export const Colors: Story = {
  render: (args) => (
    <Showcase title="Colors">
      {VARIANTS.map((variant) => (
        <div key={variant} className="flex gap-8">
          {COLORS.map((color) => (
            <Badge.Anchor key={color}>
              <Person initials="JD" />
              <Badge color={color} variant={variant} {...args}>
                3
              </Badge>
            </Badge.Anchor>
          ))}
        </div>
      ))}
    </Showcase>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <Showcase title="Sizes">
      {SIZES.map((size) => (
        <Badge.Anchor key={size}>
          <Person initials="JD" />
          <Badge size={size} {...args}>
            12
          </Badge>
        </Badge.Anchor>
      ))}
    </Showcase>
  ),
};

export const Dot: Story = {
  render: (args) => (
    <Showcase title="Dot">
      <Badge.Anchor>
        <Person initials="JD" />
        <Badge color="success" size="sm" {...args} />
      </Badge.Anchor>
    </Showcase>
  ),
};

export const OnButton: Story = {
  render: (args) => (
    <Showcase title="On a button">
      <Badge.Anchor>
        {/* The count lives in the accessible name of the control, not in the badge alone. */}
        <button
          aria-label="Inbox, 5 unread"
          className="rounded-lg bg-default px-3 py-2 text-sm text-default-foreground"
          type="button"
        >
          Inbox
        </button>
        <Badge color="danger" {...args}>
          5
        </Badge>
      </Badge.Anchor>
    </Showcase>
  ),
};
