import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Avatar} from "../avatar/index.ts";

import {AvatarGroup} from "./index.ts";

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

const USERS = [
  {hue: 210, id: 1, name: "John Doe"},
  {hue: 140, id: 2, name: "Kate Wilson"},
  {hue: 280, id: 3, name: "Emily Chen"},
  {hue: 30, id: 4, name: "Michael Brown"},
  {hue: 0, id: 5, name: "Olivia Davis"},
] as const;

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("");

/* A group reads its direct children: a function returning the array, never a wrapper component. */
const users = (count: number = USERS.length) =>
  USERS.slice(0, count).map((user) => (
    <Avatar key={user.id}>
      <Avatar.Image alt={user.name} src={portrait(user.hue)} />
      <Avatar.Fallback>{initials(user.name)}</Avatar.Fallback>
    </Avatar>
  ));

const meta: Meta<typeof AvatarGroup> = {
  argTypes: {
    color: {
      control: "select",
      options: ["accent", "default", "success", "warning", "danger"],
    },
    overlap: {
      control: "select",
      options: ["clip", "ring"],
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
  component: AvatarGroup,
  parameters: {
    layout: "padded",
  },
  title: "Components/AvatarGroup",
};

export default meta;

type Story = StoryObj<typeof AvatarGroup>;

export const Default: Story = {
  render: (args) => (
    <Showcase title="Default">
      <AvatarGroup {...args}>{users(4)}</AvatarGroup>
    </Showcase>
  ),
};

export const Max: Story = {
  render: () => (
    <Showcase title="Max">
      <AvatarGroup max={3}>{users()}</AvatarGroup>
    </Showcase>
  ),
};

export const WithCount: Story = {
  render: () => (
    <Showcase title="With Count">
      <AvatarGroup size="sm">
        {users(3)}
        <AvatarGroup.Count>+9</AvatarGroup.Count>
      </AvatarGroup>
    </Showcase>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Showcase title="Sizes">
      <div className="flex flex-col items-start gap-4">
        {(["sm", "md", "lg"] as const).map((size) => (
          <AvatarGroup key={size} max={3} size={size}>
            {users()}
          </AvatarGroup>
        ))}
      </div>
    </Showcase>
  ),
};

export const Grid: Story = {
  render: () => (
    <Showcase title="Grid">
      <div className="max-w-40">
        <AvatarGroup isGrid>{users()}</AvatarGroup>
      </div>
    </Showcase>
  ),
};

/* A striped backdrop makes the difference visible: clip leaves a transparent seam, ring paints one. */
const Stripes = ({children}: {children: ReactNode}) => (
  <div
    className="rounded-xl p-6"
    style={{
      backgroundImage:
        "repeating-linear-gradient(-45deg, transparent 0 10px, color-mix(in oklab, var(--color-danger) 28%, transparent) 10px 11px)",
    }}
  >
    {children}
  </div>
);

export const Overlap: Story = {
  render: () => (
    <Showcase title="Overlap">
      <div className="flex flex-col items-start gap-6">
        {(["clip", "ring"] as const).map((overlap) => (
          <div key={overlap} className="flex flex-col gap-2">
            <p className="text-sm text-muted">{overlap}</p>
            <Stripes>
              <AvatarGroup overlap={overlap} size="lg">
                {users(3)}
                <AvatarGroup.Count>+2</AvatarGroup.Count>
              </AvatarGroup>
            </Stripes>
          </div>
        ))}
      </div>
    </Showcase>
  ),
};

export const Labelled: Story = {
  render: () => (
    <Showcase title="Labelled">
      <AvatarGroup aria-label="Assignees" max={3} role="group" size="sm">
        {users()}
      </AvatarGroup>
    </Showcase>
  ),
};
