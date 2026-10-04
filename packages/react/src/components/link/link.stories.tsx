import type {LinkProps} from "./index.ts";
import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {buttonVariants} from "@peakui/styles";

import {ExternalLinkIcon} from "../icons.tsx";

import {Link} from "./index.ts";

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
  component: Link,
  parameters: {
    layout: "padded",
  },
  title: "Components/Link",
} satisfies Meta<typeof Link>;

export default meta;

type Story = StoryObj<typeof meta>;

const DefaultTemplate = (_props: Link["RootProps"]) => (
  <Showcase title="Default">
    <div className="flex items-center gap-4">
      <Link href="#">
        Call to action
        <Link.Icon />
      </Link>
      <Link isDisabled href="#">
        Call to action
        <Link.Icon />
      </Link>
      <Link
        href="https://example.com"
        rel="noopener noreferrer"
        target="_blank"
        className={buttonVariants({
          className: "gap-0 px-3 py-0.5 no-underline",
          size: "md",
          variant: "tertiary",
        })}
      >
        Example
        <Link.Icon className="h-2 w-2" />
      </Link>
    </div>
  </Showcase>
);

const CustomIconTemplate = (_props: Link["RootProps"]) => (
  <Showcase title="Custom Icon">
    <div className="flex items-center gap-4">
      <Link href="#">
        External Link
        <Link.Icon>
          <ExternalLinkIcon className="h-3 w-3" />
        </Link.Icon>
      </Link>
      <Link href="#">
        <Link.Icon>
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
          </svg>
        </Link.Icon>
        Info Link
      </Link>
    </div>
  </Showcase>
);

const IconPlacementTemplate = (_props: Link["RootProps"]) => (
  <Showcase title="Icon Placement">
    <div className="flex flex-col gap-4">
      <Link href="#">
        Icon at end (default)
        <Link.Icon />
      </Link>
      <Link href="#">
        <Link.Icon />
        Icon at start
      </Link>
    </div>
  </Showcase>
);

const UnderlineVariantsTemplate = (_props: LinkProps) => (
  <Showcase title="Underline Variants">
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted">Default hover underline</p>
        <Link href="#">
          Hover to see the underline
          <Link.Icon />
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted">Always visible underline</p>
        <Link className="underline" href="#">
          Underline always visible
          <Link.Icon />
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted">No underline</p>
        <Link className="no-underline" href="#">
          Link without any underline
          <Link.Icon />
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted">Changing the underline offset</p>
        <div className="flex flex-col gap-3">
          <Link className="underline-offset-1" href="#">
            Offset 1 (1px space)
            <Link.Icon />
          </Link>
          <Link className="underline-offset-2" href="#">
            Offset 2 (2px space)
            <Link.Icon />
          </Link>
          <Link className="underline-offset-3" href="#">
            Offset 3 (3px space)
            <Link.Icon />
          </Link>
          <Link className="underline-offset-4" href="#">
            Offset 4 (4px space)
            <Link.Icon />
          </Link>
        </div>
      </div>
    </div>
  </Showcase>
);

export const Default: Story = {
  render: DefaultTemplate,
};

export const CustomIcon: Story = {
  render: CustomIconTemplate,
};

export const IconPlacement: Story = {
  render: IconPlacementTemplate,
};

export const UnderlineVariants: Story = {
  render: UnderlineVariantsTemplate,
};
