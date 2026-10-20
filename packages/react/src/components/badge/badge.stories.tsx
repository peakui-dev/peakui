import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ComponentProps, ReactNode} from "react";

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

/*
 * A story-local glyph, inlined verbatim from @gravity-ui/icons (MIT) — this package does not
 * depend on that one; see THIRD-PARTY-NOTICES.md. Markup children skip the label slot, so the
 * icon badge is the case that proves the label's padding reaches text and nothing else.
 */
const BellIcon = (props: ComponentProps<"svg">) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="m4.665 7.822.62-3.096a2.77 2.77 0 0 1 5.43 0l.62 3.096a4.8 4.8 0 0 0 1.305 2.44l.194.193a.567.567 0 0 1-.273.953l-.821.19a16.6 16.6 0 0 1-7.48 0l-.82-.19a.567.567 0 0 1-.274-.953l.194-.193a4.77 4.77 0 0 0 1.305-2.44m-1.47-.294.619-3.096a4.27 4.27 0 0 1 8.372 0l.62 3.096c.126.634.438 1.216.895 1.673l.194.194a2.066 2.066 0 0 1-.997 3.475l-.821.19q-1.053.24-2.12.358a2 2 0 0 1-3.913 0 18 18 0 0 1-2.12-.359l-.822-.19a2.067 2.067 0 0 1-.997-3.474L2.3 9.2c.457-.457.769-1.04.895-1.673"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
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

export const Content: Story = {
  render: (args) => (
    <Showcase title="Content">
      <Badge.Anchor>
        <Person initials="JD" />
        <Badge color="danger" {...args}>
          5
        </Badge>
      </Badge.Anchor>
      <Badge.Anchor>
        <Person initials="JD" />
        <Badge color="danger" {...args}>
          99+
        </Badge>
      </Badge.Anchor>
      <Badge.Anchor>
        <Person initials="JD" />
        <Badge color="accent" {...args}>
          New
        </Badge>
      </Badge.Anchor>
      <Badge.Anchor>
        <Person initials="JD" />
        {/*
         * The name sits on the glyph, not on the badge: the badge renders a roleless span, and
         * aria-label on one is prohibited — axe flags it, and assistive tech ignores it.
         */}
        <Badge color="accent" {...args}>
          <BellIcon aria-label="New notifications" className="size-3" role="img" />
        </Badge>
      </Badge.Anchor>
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
