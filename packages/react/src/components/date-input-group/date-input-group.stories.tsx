import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {parseDate} from "@internationalized/date";

import {DateField} from "../date-field/index.ts";

import {DateInputGroup} from "./index.ts";

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

const Segments = () => (
  <DateInputGroup.Input>
    {(segment) => <DateInputGroup.Segment segment={segment} />}
  </DateInputGroup.Input>
);

const meta = {
  component: DateInputGroup,
  parameters: {
    layout: "padded",
  },
  title: "Components/DateInputGroup",
} satisfies Meta<typeof DateInputGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Showcase title="Default">
      <DateField aria-label="Date" defaultValue={parseDate("2026-08-15")}>
        <DateInputGroup>
          <Segments />
        </DateInputGroup>
      </DateField>
    </Showcase>
  ),
};

export const Secondary: Story = {
  render: () => (
    <Showcase title="Secondary">
      <DateField aria-label="Date" defaultValue={parseDate("2026-08-15")}>
        <DateInputGroup variant="secondary">
          <Segments />
        </DateInputGroup>
      </DateField>
    </Showcase>
  ),
};

export const WithPrefixAndSuffix: Story = {
  render: () => (
    <Showcase title="With a prefix and a suffix">
      <DateField aria-label="Date" defaultValue={parseDate("2026-08-15")}>
        <DateInputGroup>
          <DateInputGroup.Prefix>from</DateInputGroup.Prefix>
          <Segments />
          <DateInputGroup.Suffix>UTC</DateInputGroup.Suffix>
        </DateInputGroup>
      </DateField>
    </Showcase>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <Showcase title="Full width">
      <DateField fullWidth aria-label="Date" defaultValue={parseDate("2026-08-15")}>
        <DateInputGroup fullWidth>
          <Segments />
        </DateInputGroup>
      </DateField>
    </Showcase>
  ),
};

export const WithInputContainer: Story = {
  render: () => (
    <Showcase title="With an input container">
      <DateField aria-label="Date" defaultValue={parseDate("2026-08-15")}>
        <DateInputGroup className="w-40">
          <DateInputGroup.InputContainer>
            <Segments />
          </DateInputGroup.InputContainer>
        </DateInputGroup>
      </DateField>
    </Showcase>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Showcase title="Disabled">
      <DateField isDisabled aria-label="Date" defaultValue={parseDate("2026-08-15")}>
        <DateInputGroup>
          <Segments />
        </DateInputGroup>
      </DateField>
    </Showcase>
  ),
};
