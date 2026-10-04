import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Breadcrumbs, BreadcrumbsItem} from "./index.ts";

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
  component: Breadcrumbs,
  parameters: {
    layout: "padded",
  },
  title: "Components/Breadcrumbs",
} satisfies Meta<typeof Breadcrumbs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "По умолчанию",
  render: () => (
    <Showcase title="По умолчанию">
      <Breadcrumbs>
        <BreadcrumbsItem href="#">Home</BreadcrumbsItem>
        <BreadcrumbsItem href="#">Products</BreadcrumbsItem>
        <BreadcrumbsItem href="#">Electronics</BreadcrumbsItem>
        <BreadcrumbsItem>Laptop</BreadcrumbsItem>
      </Breadcrumbs>
    </Showcase>
  ),
};

export const Level3: Story = {
  name: "Три уровня",
  render: () => (
    <Showcase title="Три уровня">
      <Breadcrumbs>
        <BreadcrumbsItem href="#">Home</BreadcrumbsItem>
        <BreadcrumbsItem href="#">Category</BreadcrumbsItem>
        <BreadcrumbsItem>Current Page</BreadcrumbsItem>
      </Breadcrumbs>
    </Showcase>
  ),
};

export const Level2: Story = {
  name: "Два уровня",
  render: () => (
    <Showcase title="Два уровня">
      <Breadcrumbs>
        <BreadcrumbsItem href="#">Home</BreadcrumbsItem>
        <BreadcrumbsItem>Current Page</BreadcrumbsItem>
      </Breadcrumbs>
    </Showcase>
  ),
};

export const CustomSeparator: Story = {
  name: "Свой разделитель",
  render: () => (
    <Showcase title="Свой разделитель">
      <Breadcrumbs separator={<span aria-hidden="true">/</span>}>
        <BreadcrumbsItem href="#">Home</BreadcrumbsItem>
        <BreadcrumbsItem href="#">Products</BreadcrumbsItem>
        <BreadcrumbsItem href="#">Electronics</BreadcrumbsItem>
        <BreadcrumbsItem>Laptop</BreadcrumbsItem>
      </Breadcrumbs>
    </Showcase>
  ),
};

export const Disabled: Story = {
  name: "Неактивная цепочка",
  render: () => (
    <Showcase title="Неактивная цепочка">
      <Breadcrumbs isDisabled>
        <BreadcrumbsItem href="#">Home</BreadcrumbsItem>
        <BreadcrumbsItem href="#">Products</BreadcrumbsItem>
        <BreadcrumbsItem href="#">Electronics</BreadcrumbsItem>
        <BreadcrumbsItem>Laptop</BreadcrumbsItem>
      </Breadcrumbs>
    </Showcase>
  ),
};
