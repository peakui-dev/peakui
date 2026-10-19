import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Code, Heading, Paragraph, Prose, Typography} from "./index.ts";

/*
 * Every story carries a level-two heading: the audit in apps/storybook/e2e waits for it as the
 * sign that the preview is ready, and without it axe runs against an empty iframe and passes.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex max-w-xl flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-muted">{title}</h2>
    {children}
  </div>
);

const meta = {
  argTypes: {
    align: {control: "select", options: ["start", "center", "end", "justify"]},
    color: {control: "select", options: ["default", "muted"]},
    type: {
      control: "select",
      options: ["h1", "h2", "h3", "h4", "h5", "h6", "body", "body-sm", "body-xs", "code"],
    },
    weight: {control: "select", options: ["normal", "medium", "semibold", "bold"]},
  },
  component: Typography,
  parameters: {layout: "padded"},
  title: "Components/Typography",
} satisfies Meta<typeof Typography>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Showcase title="Default">
      <Typography {...args}>The quick brown fox jumps over the lazy dog.</Typography>
    </Showcase>
  ),
};

export const Headings: Story = {
  render: () => (
    <Showcase title="Headings">
      {([1, 2, 3, 4, 5, 6] as const).map((level) => (
        <Heading key={level} level={level}>
          Heading level {level}
        </Heading>
      ))}
    </Showcase>
  ),
};

export const Paragraphs: Story = {
  render: () => (
    <Showcase title="Paragraphs">
      <Paragraph>Base: the default body text of a page.</Paragraph>
      <Paragraph size="sm">Small: secondary text and captions.</Paragraph>
      <Paragraph size="xs">Extra small: fine print and metadata.</Paragraph>
    </Showcase>
  ),
};

export const Inline: Story = {
  render: () => (
    <Showcase title="Code">
      <Paragraph>
        Run <Code>pnpm test</Code> before you push.
      </Paragraph>
    </Showcase>
  ),
};

export const MutedAndWeights: Story = {
  render: () => (
    <Showcase title="Muted and weights">
      <Paragraph color="muted">Muted text for supporting information.</Paragraph>
      {(["normal", "medium", "semibold", "bold"] as const).map((weight) => (
        <Paragraph key={weight} weight={weight}>
          Weight {weight}
        </Paragraph>
      ))}
    </Showcase>
  ),
};

export const Alignment: Story = {
  render: () => (
    <Showcase title="Alignment">
      {(["start", "center", "end", "justify"] as const).map((align) => (
        <Paragraph key={align} align={align}>
          Aligned to {align}: a line long enough to show how the text sits in its box.
        </Paragraph>
      ))}
    </Showcase>
  ),
};

export const Truncate: Story = {
  render: () => (
    <Showcase title="Truncate">
      <div className="w-48">
        <Paragraph truncate>A long line that does not fit in its container and is cut.</Paragraph>
      </div>
    </Showcase>
  ),
};

export const ProseBlock: Story = {
  render: () => (
    <Showcase title="Prose">
      <Prose>
        <h1>Prose</h1>
        <p>
          Styles the elements inside it, such as <a href="#top">a link</a>, <code>code</code>,{" "}
          <strong>strong</strong> and <em>emphasis</em> text.
        </p>
        <blockquote>A quotation with its own rule.</blockquote>
        <ul>
          <li>A list item</li>
          <li>Another list item</li>
        </ul>
        <pre>const answer = 42;</pre>
      </Prose>
    </Showcase>
  ),
};
