import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Skeleton} from "./index.ts";

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
  component: Skeleton,
  parameters: {
    layout: "padded",
  },
  title: "Components/Skeleton",
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

/* A media block and three text lines — the card-shaped placeholder the reference shows first. */
const Card = () => (
  <div className="w-[200px] space-y-5 rounded-3xl bg-surface p-4 shadow-surface">
    <Skeleton className="h-24 rounded-xl" />
    <div className="space-y-3">
      <Skeleton className="h-3 w-3/5 rounded-lg" />
      <Skeleton className="h-3 w-4/5 rounded-lg" />
      <Skeleton className="h-3 w-2/5 rounded-lg" />
    </div>
  </div>
);

export const Default: Story = {
  name: "Карточка",
  render: () => (
    <Showcase title="Карточка">
      <Card />
    </Showcase>
  ),
};

export const Grid: Story = {
  name: "Сетка",
  render: () => (
    <Showcase title="Сетка">
      <div className="grid w-[450px] grid-cols-3 gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </Showcase>
  ),
};

/*
 * The modifier on the parent container switches its children to one synchronized shimmer that
 * passes over all of them at once; the children opt out of their own with animationType="none".
 */
export const SingleShimmer: Story = {
  name: "Общий шиммер",
  render: () => (
    <Showcase title="Общий шиммер">
      <div className="skeleton--shimmer relative grid w-[450px] grid-cols-3 gap-4 overflow-hidden rounded-xl">
        <Skeleton animationType="none" className="h-24 rounded-xl" />
        <Skeleton animationType="none" className="h-24 rounded-xl" />
        <Skeleton animationType="none" className="h-24 rounded-xl" />
      </div>
    </Showcase>
  ),
};

/* Every variant value gets a story: a variant with no story is invisible to VRT and docs. */
export const AnimationTypes: Story = {
  name: "Типы анимации",
  render: () => (
    <Showcase title="Типы анимации">
      {(["shimmer", "pulse", "none"] as const).map((animationType) => (
        <div key={animationType} className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted">{animationType}</p>
          <div className="w-[200px] space-y-3 rounded-3xl bg-surface p-4 shadow-surface">
            <Skeleton animationType={animationType} className="h-20 rounded-lg" />
            <Skeleton animationType={animationType} className="h-3 w-3/5 rounded-lg" />
            <Skeleton animationType={animationType} className="h-3 w-4/5 rounded-lg" />
          </div>
        </div>
      ))}
    </Showcase>
  ),
};
