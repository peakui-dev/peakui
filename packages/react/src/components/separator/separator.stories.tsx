import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Separator} from "./index.ts";

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

/* Строка с вертикальными разделителями — повторяющийся блок двух историй. */
const BreadcrumbRow = () => (
  <div className="flex h-5 items-center space-x-4 text-sm">
    <div>Blog</div>
    <Separator orientation="vertical" />
    <div>Docs</div>
    <Separator orientation="vertical" />
    <div>Source</div>
  </div>
);

const items = [
  {
    subtitle: "Receive account activity updates",
    title: "Set Up Notifications",
  },
  {
    subtitle: "Connect your browser to your account",
    title: "Set up Browser Extension",
  },
  {
    subtitle: "Create your first collectible",
    title: "Mint Collectible",
  },
];

const meta = {
  component: Separator,
  parameters: {
    layout: "padded",
  },
  title: "Components/Separator",
} satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "По умолчанию",
  render: () => (
    <Showcase title="По умолчанию">
      <div className="max-w-md">
        <div className="space-y-1">
          <h4 className="text-base font-medium">PeakUI Components</h4>
          <p className="text-sm text-muted">
            The design system core: primitives, tokens and charts.
          </p>
        </div>
        <Separator className="my-4" />
        <BreadcrumbRow />
      </div>
    </Showcase>
  ),
};

export const Vertical: Story = {
  name: "Вертикальный",
  render: () => (
    <Showcase title="Вертикальный">
      <BreadcrumbRow />
    </Showcase>
  ),
};

export const WithContent: Story = {
  name: "Между блоками контента",
  render: () => (
    <Showcase title="Между блоками контента">
      <div className="max-w-md space-y-4 rounded-3xl bg-surface p-4 shadow-surface">
        {items.map((item, index) => (
          <div key={item.title}>
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-0">
                <h4 className="text-sm font-medium">{item.title}</h4>
                <p className="text-sm text-muted">{item.subtitle}</p>
              </div>
            </div>
            {index < items.length - 1 && <Separator className="my-4" />}
          </div>
        ))}
      </div>
    </Showcase>
  ),
};

export const Variants: Story = {
  name: "Варианты",
  render: () => (
    <Showcase title="Варианты">
      <div className="flex max-w-md flex-col items-center gap-3">
        <div>Default Variant</div>
        <Separator variant="default" />
        <div>Secondary Variant</div>
        <Separator variant="secondary" />
        <div>Tertiary Variant</div>
        <Separator variant="tertiary" />
      </div>
    </Showcase>
  ),
};
