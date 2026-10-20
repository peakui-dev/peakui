import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Accordion} from "./index.ts";

/*
 * Every story carries a level-two heading: the audit in apps/storybook/e2e waits for it as the
 * sign that the preview is ready, and without it axe runs against an empty iframe and passes.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex w-full max-w-md flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    {children}
  </div>
);

const items = [
  {
    content:
      "Browse the catalog, add items to your cart and proceed to checkout. Shipping and payment details complete the order.",
    id: "order",
    title: "How do I place an order?",
  },
  {
    content:
      "Orders can be changed or cancelled until they ship. Once an order is processed, it is final.",
    id: "cancel",
    title: "Can I modify or cancel my order?",
  },
  {
    content: "We accept all major credit cards, including Visa, Mastercard and American Express.",
    id: "payment",
    title: "What payment methods do you accept?",
  },
];

const Items = () =>
  items.map((item) => (
    <Accordion.Item key={item.id} id={item.id}>
      <Accordion.Heading>
        <Accordion.Trigger>
          {item.title}
          <Accordion.Indicator />
        </Accordion.Trigger>
      </Accordion.Heading>
      <Accordion.Panel>
        <Accordion.Body>{item.content}</Accordion.Body>
      </Accordion.Panel>
    </Accordion.Item>
  ));

const meta = {
  argTypes: {
    allowsMultipleExpanded: {control: {type: "boolean"}},
    hideSeparator: {control: {type: "boolean"}},
    isDisabled: {control: {type: "boolean"}},
    variant: {control: {type: "inline-radio"}, options: ["default", "surface"]},
  },
  component: Accordion,
  parameters: {
    layout: "padded",
  },
  title: "Components/Accordion",
} satisfies Meta<typeof Accordion>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {allowsMultipleExpanded: true},
  render: (args) => (
    <Showcase title="Default">
      <Accordion {...args}>
        <Items />
      </Accordion>
    </Showcase>
  ),
};

export const Surface: Story = {
  args: {variant: "surface"},
  render: (args) => (
    <Showcase title="Surface">
      <Accordion {...args}>
        <Items />
      </Accordion>
    </Showcase>
  ),
};

export const WithoutSeparator: Story = {
  args: {hideSeparator: true},
  render: (args) => (
    <Showcase title="Without Separator">
      <Accordion {...args}>
        <Items />
      </Accordion>
    </Showcase>
  ),
};

export const DefaultExpanded: Story = {
  args: {defaultExpandedKeys: ["cancel"]},
  render: (args) => (
    <Showcase title="Default Expanded">
      <Accordion {...args}>
        <Items />
      </Accordion>
    </Showcase>
  ),
};

export const Disabled: Story = {
  args: {isDisabled: true},
  render: (args) => (
    <Showcase title="Disabled">
      <Accordion {...args}>
        <Items />
      </Accordion>
    </Showcase>
  ),
};
