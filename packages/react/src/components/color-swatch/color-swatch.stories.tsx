import type {ColorSwatchProps} from "./index.ts";
import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {ColorSwatch} from "./index.ts";

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
  argTypes: {
    color: {
      control: "color",
    },
    shape: {
      control: "select",
      options: ["circle", "square"],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
    },
  },
  component: ColorSwatch,
  parameters: {
    layout: "centered",
  },
  title: "Components/Colors/ColorSwatch",
} satisfies Meta<typeof ColorSwatch>;

export default meta;

type Story = StoryObj<typeof meta>;

const defaultArgs: ColorSwatchProps = {
  color: "#0485F7",
};

const Template = (props: ColorSwatchProps) => (
  <Showcase title="Default">
    <div className="flex items-center gap-3">
      <ColorSwatch className="h-5 w-5" {...props} />
    </div>
  </Showcase>
);

const ShapesTemplate = (props: ColorSwatchProps) => (
  <Showcase title="Shapes">
    <div className="flex items-center gap-3">
      <ColorSwatch {...props} shape="circle" />
      <ColorSwatch {...props} shape="square" />
    </div>
  </Showcase>
);

const ColorsTemplate = (_props: ColorSwatchProps) => (
  <Showcase title="Colors">
    <div className="flex items-center gap-3">
      <ColorSwatch aria-label="Blue" color="#0485F7" />
      <ColorSwatch aria-label="Red" color="#EF4444" />
      <ColorSwatch aria-label="Amber" color="#F59E0B" />
      <ColorSwatch aria-label="Green" color="#10B981" />
      <ColorSwatch aria-label="Fuchsia" color="#D946EF" />
    </div>
  </Showcase>
);

const SizesTemplate = (props: ColorSwatchProps) => (
  <Showcase title="Sizes">
    <div className="flex items-center gap-3">
      <ColorSwatch {...props} color="#0485F7" size="xs" />
      <ColorSwatch {...props} color="#EF4444" size="sm" />
      <ColorSwatch {...props} color="#F59E0B" size="md" />
      <ColorSwatch {...props} color="#10B981" size="lg" />
      <ColorSwatch {...props} color="#D946EF" size="xl" />
    </div>
  </Showcase>
);

const TransparencyTemplate = (_props: ColorSwatchProps) => (
  <Showcase title="Transparency">
    <div className="flex items-center gap-3">
      <ColorSwatch aria-label="100% opacity" color="rgba(4, 133, 247, 1)" />
      <ColorSwatch aria-label="75% opacity" color="rgba(4, 133, 247, 0.75)" />
      <ColorSwatch aria-label="50% opacity" color="rgba(4, 133, 247, 0.5)" />
      <ColorSwatch aria-label="25% opacity" color="rgba(4, 133, 247, 0.25)" />
      <ColorSwatch aria-label="0% opacity" color="rgba(4, 133, 247, 0)" />
    </div>
  </Showcase>
);

const WithColorNameTemplate = (_props: ColorSwatchProps) => (
  <Showcase title="WithColorName">
    <div className="flex items-center gap-3">
      <ColorSwatch aria-label="Primary color" color="#0485F7" colorName="Primary blue" />
      <ColorSwatch aria-label="Danger color" color="#EF4444" colorName="Danger red" />
      <ColorSwatch aria-label="Warning color" color="#F59E0B" colorName="Warning amber" />
      <ColorSwatch aria-label="Success color" color="#10B981" colorName="Success green" />
      <ColorSwatch aria-label="Accent color" color="#D946EF" colorName="Accent fuchsia" />
    </div>
  </Showcase>
);

const StyleRenderPropsTemplate = (_props: ColorSwatchProps) => {
  const colors = ["#0485F7", "#EF4444", "#F59E0B", "#10B981", "#D946EF"];

  return (
    <Showcase title="StyleRenderProps">
      <div className="flex flex-col gap-6">
        {/* Custom border using render props */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-muted">Custom Border</h3>
          <div className="flex items-center gap-3">
            {colors.map((color) => (
              <ColorSwatch
                key={color}
                color={color}
                size="lg"
                style={({color: c}) => ({
                  boxShadow: `0 0 0 3px ${c.toString("css")}40`,
                })}
              />
            ))}
          </div>
        </div>

        {/* Custom shadow using render props */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-muted">Custom Shadow</h3>
          <div className="flex items-center gap-3">
            {colors.map((color) => (
              <ColorSwatch
                key={color}
                color={color}
                size="lg"
                style={({color: c}) => ({
                  boxShadow: `0 4px 14px ${c.toString("css")}80`,
                })}
              />
            ))}
          </div>
        </div>

        {/* Outline style using render props */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-muted">Outline Style</h3>
          <div className="flex items-center gap-3">
            {colors.map((color) => (
              <ColorSwatch
                key={color}
                color={color}
                size="lg"
                style={({color: c}) => ({
                  boxShadow: `inset 0 0 0 2px ${c.toString("css")}, inset 0 0 0 4px white`,
                })}
              />
            ))}
          </div>
        </div>
      </div>
    </Showcase>
  );
};

const AllVariantsTemplate = (_props: ColorSwatchProps) => {
  const sizes = ["xs", "sm", "md", "lg", "xl"] as const;
  const shapes = ["circle", "square"] as const;
  const colors = ["#0485F7", "#EF4444", "#F59E0B", "#10B981", "#D946EF"];

  return (
    <Showcase title="AllVariants">
      <div className="flex flex-col gap-6">
        {shapes.map((shape) => (
          <div key={shape} className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-muted capitalize">{shape}</h3>
            <div className="flex flex-col gap-3">
              {sizes.map((size) => (
                <div key={size} className="flex items-center gap-3">
                  <div className="w-12 text-sm text-muted">{size}</div>
                  {colors.map((color) => (
                    <ColorSwatch key={color} color={color} shape={shape} size={size} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Showcase>
  );
};

export const Default: Story = {
  args: defaultArgs,
  render: Template,
};

export const Shapes: Story = {
  args: defaultArgs,
  render: ShapesTemplate,
};

export const Colors: Story = {
  args: defaultArgs,
  render: ColorsTemplate,
};

export const Sizes: Story = {
  args: defaultArgs,
  render: SizesTemplate,
};

export const Transparency: Story = {
  args: defaultArgs,
  render: TransparencyTemplate,
};

export const WithColorName: Story = {
  args: defaultArgs,
  render: WithColorNameTemplate,
};

export const StyleRenderProps: Story = {
  args: defaultArgs,
  render: StyleRenderPropsTemplate,
};

export const AllVariants: Story = {
  args: defaultArgs,
  render: AllVariantsTemplate,
};
