import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Avatar} from "./index.ts";

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
 * Stories load no remote image: a portrait drawn as an SVG data URI renders the same offline, on
 * every machine and in every visual snapshot. The hue picks the background.
 */
const portrait = (hue: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="hsl(${hue} 55% 58%)"/><circle cx="20" cy="16" r="7" fill="white" fill-opacity="0.85"/><path d="M6 40a14 14 0 0 1 28 0z" fill="white" fill-opacity="0.85"/></svg>`,
  )}`;

/* An address that cannot resolve, so the image never loads and the fallback has to carry. */
const BROKEN_SRC = "https://invalid.test/avatar.png";

const PersonIcon = () => (
  <svg aria-hidden="true" fill="currentColor" height="16" viewBox="0 0 16 16" width="16">
    <path d="M8 1a3.25 3.25 0 1 0 0 6.5A3.25 3.25 0 0 0 8 1M4.5 4.25a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0M3 12.5c0-.8.9-1.75 2.2-2.2A8 8 0 0 1 8 9.9c1 0 1.95.15 2.8.4C12.1 10.75 13 11.7 13 12.5v.5H3z" />
  </svg>
);

const meta: Meta<typeof Avatar> = {
  argTypes: {
    color: {
      control: "select",
      options: ["accent", "default", "success", "warning", "danger"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    variant: {
      control: "select",
      options: ["default", "soft"],
    },
  },
  component: Avatar,
  parameters: {
    layout: "padded",
  },
  title: "Components/Avatar",
};

export default meta;

type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {children: null},
  render: ({color, size, variant}) => (
    <Showcase title="Default">
      <div className="flex items-center gap-4">
        <Avatar color={color} size={size} variant={variant}>
          <Avatar.Image alt="Jane Doe" src={portrait(210)} />
          <Avatar.Fallback>JD</Avatar.Fallback>
        </Avatar>
        <Avatar color={color} size={size} variant={variant}>
          <Avatar.Image alt="Sam Rivera" src={portrait(30)} />
          <Avatar.Fallback>SR</Avatar.Fallback>
        </Avatar>
        <Avatar color={color} size={size} variant={variant}>
          <Avatar.Fallback>PG</Avatar.Fallback>
        </Avatar>
        <Avatar color={color} size={size} variant={variant}>
          <Avatar.Fallback>
            <PersonIcon />
          </Avatar.Fallback>
        </Avatar>
      </div>
    </Showcase>
  ),
};

export const Sizes: Story = {
  args: {children: null},
  render: () => (
    <Showcase title="Sizes">
      <div className="flex items-center gap-4">
        <Avatar size="sm">
          <Avatar.Image alt="Small" src={portrait(150)} />
          <Avatar.Fallback>SM</Avatar.Fallback>
        </Avatar>
        <Avatar size="md">
          <Avatar.Image alt="Medium" src={portrait(250)} />
          <Avatar.Fallback>MD</Avatar.Fallback>
        </Avatar>
        <Avatar size="lg">
          <Avatar.Image alt="Large" src={portrait(330)} />
          <Avatar.Fallback>LG</Avatar.Fallback>
        </Avatar>
      </div>
    </Showcase>
  ),
};

export const Colors: Story = {
  args: {children: null},
  render: () => (
    <Showcase title="Colors">
      <div className="flex items-center gap-4">
        <Avatar color="default">
          <Avatar.Fallback>DF</Avatar.Fallback>
        </Avatar>
        <Avatar color="accent">
          <Avatar.Fallback>AC</Avatar.Fallback>
        </Avatar>
        <Avatar color="success">
          <Avatar.Fallback>SC</Avatar.Fallback>
        </Avatar>
        <Avatar color="warning">
          <Avatar.Fallback>WR</Avatar.Fallback>
        </Avatar>
        <Avatar color="danger">
          <Avatar.Fallback>DG</Avatar.Fallback>
        </Avatar>
      </div>
    </Showcase>
  ),
};

const COLORS = ["accent", "default", "success", "warning", "danger"] as const;

export const Variants: Story = {
  args: {children: null},
  render: () => (
    <Showcase title="Variants">
      <div className="flex flex-col gap-4">
        {(["default", "soft"] as const).map((variant) => (
          <div key={variant} className="flex items-center gap-4">
            <span className="w-16 text-sm text-muted">{variant}</span>
            {COLORS.map((color) => (
              <Avatar key={color} color={color} variant={variant}>
                <Avatar.Fallback>{color.slice(0, 2).toUpperCase()}</Avatar.Fallback>
              </Avatar>
            ))}
          </div>
        ))}
      </div>
    </Showcase>
  ),
};

export const Fallback: Story = {
  args: {children: null},
  render: () => (
    <Showcase title="Fallback">
      <div className="flex items-center gap-4">
        {/* Text fallback */}
        <Avatar>
          <Avatar.Fallback>JD</Avatar.Fallback>
        </Avatar>
        {/* Icon fallback */}
        <Avatar>
          <Avatar.Fallback>
            <PersonIcon />
          </Avatar.Fallback>
        </Avatar>
        {/* An image that fails to load */}
        <Avatar>
          <Avatar.Image alt="Broken image" src={BROKEN_SRC} />
          <Avatar.Fallback>NA</Avatar.Fallback>
        </Avatar>
        {/* Custom styled fallback */}
        <Avatar>
          <Avatar.Fallback className="bg-accent text-accent-foreground">GB</Avatar.Fallback>
        </Avatar>
      </div>
    </Showcase>
  ),
};

export const WithDelay: Story = {
  args: {children: null},
  render: () => (
    <Showcase title="With Delay">
      <div className="flex items-center gap-4">
        {/* The fallback waits 600ms, so a quickly loading image never flashes it */}
        <Avatar>
          <Avatar.Image alt="Jane Doe" src={portrait(210)} />
          <Avatar.Fallback delayMs={600}>JD</Avatar.Fallback>
        </Avatar>
        <Avatar>
          <Avatar.Image alt="Broken image" src={BROKEN_SRC} />
          <Avatar.Fallback delayMs={600}>NA</Avatar.Fallback>
        </Avatar>
      </div>
    </Showcase>
  ),
};
