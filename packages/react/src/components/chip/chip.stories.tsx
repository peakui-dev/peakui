import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ComponentProps, ReactNode} from "react";

import {CircleDashedIcon} from "../icons.tsx";

import {Chip} from "./index.ts";

/* What Storybook derives for `args`, and therefore what the templates accept. */
type ChipArgs = ComponentProps<typeof Chip>;

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
 * The reference composes its status chips with a 6px filled dot; the glyph set has no such icon,
 * so the story carries the dot itself — stories are example corpus, not library code.
 */
const StatusDot = () => (
  <svg aria-hidden="true" fill="currentColor" height={6} viewBox="0 0 6 6" width={6}>
    <circle cx={3} cy={3} r={3} />
  </svg>
);

const meta = {
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
      options: ["primary", "secondary", "tertiary", "soft"],
    },
  },
  component: Chip,
  parameters: {
    layout: "padded",
  },
  title: "Components/Chip",
} satisfies Meta<typeof Chip>;

export default meta;

type Story = StoryObj<typeof meta>;

/*
 * Untyped on purpose: `args` is checked against the props Storybook derives from the generic
 * Root, and annotating it as ChipProps fixes E early enough to clash with that derivation.
 */
const defaultArgs = {
  children: "Label",
  color: "accent",
  variant: "secondary",
} as const;

const Template = (props: ChipArgs) => (
  <div className="flex items-center gap-3">
    <Chip {...props}>Label</Chip>
  </div>
);

const SizesTemplate = (props: ChipArgs) => (
  <div className="flex items-center gap-3">
    <Chip {...props} size="sm">
      Small
    </Chip>
    <Chip {...props} size="md">
      Medium
    </Chip>
    <Chip {...props} size="lg">
      Large
    </Chip>
  </div>
);

const WithIconTemplate = (props: ChipArgs) => (
  <div className="flex items-center gap-3">
    <Chip {...props}>
      <CircleDashedIcon />
      <Chip.Label>Label</Chip.Label>
      <CircleDashedIcon />
    </Chip>
  </div>
);

const StatusesTemplate = (props: ChipArgs) => {
  const variants = ["primary", "secondary", "tertiary", "soft"] as const;

  return (
    <div className="flex flex-col gap-4">
      {variants.map((variant) => (
        <div key={variant} className="flex items-center gap-3">
          <Chip {...props} variant={variant}>
            <StatusDot />
            <Chip.Label>Information</Chip.Label>
          </Chip>
          <Chip {...props} color="success" variant={variant}>
            <StatusDot />
            <Chip.Label>Completed</Chip.Label>
          </Chip>
          <Chip {...props} color="warning" variant={variant}>
            <StatusDot />
            <Chip.Label>Pending</Chip.Label>
          </Chip>
          <Chip {...props} color="danger" variant={variant}>
            <StatusDot />
            <Chip.Label>Failed</Chip.Label>
          </Chip>
        </div>
      ))}
    </div>
  );
};

const VariantsTemplate = (props: ChipArgs) => {
  const sizes = ["lg", "md", "sm"] as const;
  const variants = ["primary", "secondary", "tertiary", "soft"] as const;
  const colors = ["accent", "default", "success", "warning", "danger"] as const;

  return (
    <div className="flex flex-col gap-8">
      {sizes.map((size) => (
        <div key={size} className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-muted capitalize">{size}</h3>
          {/* Color labels header */}
          <div className="flex items-center gap-3">
            <div className="w-24 shrink-0" />
            {colors.map((color) => (
              <div
                key={color}
                className="flex shrink-0 items-center justify-center"
                style={{width: "130px"}}
              >
                <span className="text-xs text-muted capitalize">{color}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {variants.map((variant) => (
              <div key={variant} className="flex items-center gap-3">
                <div className="w-24 shrink-0 text-sm text-muted capitalize">{variant}</div>
                {colors.map((color) => (
                  <div
                    key={color}
                    className="flex shrink-0 items-center justify-center"
                    style={{width: "130px"}}
                  >
                    <Chip {...props} color={color} size={size} variant={variant}>
                      <CircleDashedIcon />
                      <Chip.Label>Label</Chip.Label>
                      <CircleDashedIcon />
                    </Chip>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/*
 * The templates stay verbatim from the reference; each story wraps one in the Showcase heading
 * the e2e audit waits for.
 */
export const Default: Story = {
  args: defaultArgs,
  name: "По умолчанию",
  render: (props) => (
    <Showcase title="По умолчанию">
      <Template {...props} />
    </Showcase>
  ),
};

export const Sizes: Story = {
  args: defaultArgs,
  name: "Размеры",
  render: (props) => (
    <Showcase title="Размеры">
      <SizesTemplate {...props} />
    </Showcase>
  ),
};

export const WithIcon: Story = {
  args: defaultArgs,
  name: "С иконкой",
  render: (props) => (
    <Showcase title="С иконкой">
      <WithIconTemplate {...props} />
    </Showcase>
  ),
};

export const Statuses: Story = {
  args: defaultArgs,
  name: "Статусы",
  render: (props) => (
    <Showcase title="Статусы">
      <StatusesTemplate {...props} />
    </Showcase>
  ),
};

export const Variants: Story = {
  args: defaultArgs,
  name: "Варианты",
  render: (props) => (
    <Showcase title="Варианты">
      <VariantsTemplate {...props} />
    </Showcase>
  ),
};
