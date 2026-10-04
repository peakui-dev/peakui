import type {SurfaceVariants} from "@peakui/styles";
import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Input} from "../input/index.ts";
import {Label} from "../label/index.ts";
import {TextField} from "../textfield/index.ts";

import {Surface} from "./index.ts";

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
  component: Surface,
  parameters: {
    layout: "padded",
  },
  title: "Components/Surface",
} satisfies Meta<typeof Surface>;

export default meta;

/*
 * Surface is the first component here with required children, and strict CSF typing then demands
 * `args` on every render-only story. `children: null` satisfies the requirement; each story's
 * `render` composes its own content.
 */
type Story = StoryObj<typeof meta>;

/*
 * The labelled level with a field inside — the shape every consumer composes: a control nested on
 * a surface level, re-basing its fill against the ambient one through SurfaceContext.
 */
const Level = ({
  caption,
  label,
  variant,
}: {
  caption: string;
  label: string;
  variant?: SurfaceVariants["variant"];
}) => (
  <div className="flex flex-col gap-2">
    <p className="text-sm font-medium text-muted">{label}</p>
    <Surface
      className="flex min-w-[320px] flex-col gap-3 rounded-3xl p-6"
      variant={variant ?? "default"}
    >
      <h3 className="text-base font-semibold text-foreground">Surface Content</h3>
      <TextField isRequired name="email" type="email">
        <Label>Email</Label>
        <Input className="w-[280px]" placeholder="john@example.com" />
      </TextField>
      <p className="text-sm text-muted">{caption}</p>
    </Surface>
  </div>
);

export const Default: Story = {
  args: {children: null},
  name: "По умолчанию",
  render: () => (
    <Showcase title="По умолчанию">
      <Level
        caption="This is a default surface variant. It uses bg-surface styling."
        label="Default"
      />
    </Showcase>
  ),
};

export const Variants: Story = {
  args: {children: null},
  name: "Варианты",
  render: () => (
    <Showcase title="Варианты">
      <div className="flex flex-col gap-4">
        <Level
          caption="This is a transparent surface variant. It uses bg-transparent styling."
          label="Transparent"
          variant="transparent"
        />
        <Level
          caption="This is a default surface variant. It uses bg-surface styling."
          label="Default"
        />
        <Level
          caption="This is a secondary surface variant. It uses bg-surface-secondary styling."
          label="Secondary"
          variant="secondary"
        />
        <Level
          caption="This is a tertiary surface variant. It uses bg-surface-tertiary styling."
          label="Tertiary"
          variant="tertiary"
        />
      </div>
    </Showcase>
  ),
};

/*
 * One surface inside another: each level provides the ambient one for whatever nests in it, and
 * the transparent variant re-bases on its parent instead of painting its own background.
 */
export const Nested: Story = {
  args: {children: null},
  name: "Вложенные уровни",
  render: () => (
    <Showcase title="Вложенные уровни">
      <Surface className="flex w-fit flex-col gap-4 rounded-3xl p-6">
        <h3 className="text-base font-semibold text-foreground">Default</h3>
        <Surface className="flex flex-col gap-4 rounded-2xl p-6" variant="secondary">
          <h3 className="text-base font-semibold text-foreground">Secondary</h3>
          <TextField isRequired name="email" type="email">
            <Label>Email</Label>
            <Input className="w-[280px]" placeholder="john@example.com" />
          </TextField>
          <Surface className="flex flex-col gap-2 rounded-xl p-6" variant="tertiary">
            <h3 className="text-base font-semibold text-foreground">Tertiary</h3>
            <p className="text-sm text-muted">
              The innermost level re-bases its fill against the one it nests in.
            </p>
          </Surface>
        </Surface>
      </Surface>
    </Showcase>
  ),
};
