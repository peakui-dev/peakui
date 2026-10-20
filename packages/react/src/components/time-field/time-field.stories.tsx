import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ComponentProps, ReactNode} from "react";

import {Time} from "@internationalized/date";
import {useState} from "react";

import {Button} from "../button/index.ts";
import {Description} from "../description/index.ts";
import {FieldError} from "../field-error/index.ts";
import {Label} from "../label/index.ts";

import {TimeField} from "./index.ts";

/* Story-local glyph: this package depends on no icon library. */
const ClockIcon = (props: ComponentProps<"svg">) => (
  <svg
    aria-hidden="true"
    className="size-4"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeWidth="1.5"
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="8" cy="8" r="6.25" />
    <path d="M8 4.5V8l2.25 1.5" />
  </svg>
);

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
  <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
);

const meta = {
  component: TimeField,
  parameters: {
    layout: "padded",
  },
  title: "Components/TimeField",
} satisfies Meta<typeof TimeField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Showcase title="Default">
      <TimeField className="w-64" name="time">
        <Label>Time</Label>
        <TimeField.Group>
          <Segments />
        </TimeField.Group>
      </TimeField>
    </Showcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <Showcase title="Primary and secondary">
      <TimeField className="w-64" name="primary-time">
        <Label>Primary</Label>
        <TimeField.Group variant="primary">
          <Segments />
        </TimeField.Group>
      </TimeField>
      <TimeField className="w-64" name="secondary-time">
        <Label>Secondary</Label>
        <TimeField.Group variant="secondary">
          <Segments />
        </TimeField.Group>
      </TimeField>
    </Showcase>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <Showcase title="Full width">
      <TimeField fullWidth name="time">
        <Label>Time</Label>
        <TimeField.Group fullWidth>
          <TimeField.Prefix>
            <ClockIcon />
          </TimeField.Prefix>
          <Segments />
        </TimeField.Group>
      </TimeField>
    </Showcase>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Showcase title="With a description">
      <TimeField className="w-64" name="meeting">
        <Label>Meeting time</Label>
        <TimeField.Group>
          <Segments />
        </TimeField.Group>
        <Description>Enter the start of the meeting</Description>
      </TimeField>
    </Showcase>
  ),
};

export const Required: Story = {
  render: () => (
    <Showcase title="Required">
      <TimeField isRequired className="w-64" name="time">
        <Label>Start time</Label>
        <TimeField.Group>
          <Segments />
        </TimeField.Group>
        <Description>Required field</Description>
      </TimeField>
    </Showcase>
  ),
};

export const Invalid: Story = {
  render: () => (
    <Showcase title="Invalid">
      <TimeField isInvalid className="w-64" name="time">
        <Label>Time</Label>
        <TimeField.Group>
          <Segments />
        </TimeField.Group>
        <FieldError>Time must be within opening hours</FieldError>
      </TimeField>
    </Showcase>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Showcase title="Disabled">
      <TimeField isDisabled className="w-64" defaultValue={new Time(9, 30)} name="time">
        <Label>Time</Label>
        <TimeField.Group>
          <Segments />
        </TimeField.Group>
        <Description>This time field is disabled</Description>
      </TimeField>
    </Showcase>
  ),
};

export const WithPrefixAndSuffix: Story = {
  render: () => (
    <Showcase title="With a prefix and a suffix">
      <TimeField className="w-64" name="time">
        <Label>Time</Label>
        <TimeField.Group>
          <TimeField.Prefix>
            <ClockIcon />
          </TimeField.Prefix>
          <Segments />
          <TimeField.Suffix>UTC</TimeField.Suffix>
        </TimeField.Group>
      </TimeField>
    </Showcase>
  ),
};

export const Controlled: Story = {
  render: function ControlledStory() {
    const [value, setValue] = useState<Time | null>(new Time(9, 30));

    return (
      <Showcase title="Controlled">
        <TimeField className="w-64" name="time" value={value} onChange={setValue}>
          <Label>Time</Label>
          <TimeField.Group>
            <Segments />
          </TimeField.Group>
          <Description>Current value: {value ? value.toString() : "(empty)"}</Description>
        </TimeField>
        <div className="flex gap-2">
          <Button variant="tertiary" onPress={() => setValue(new Time(12))}>
            Set noon
          </Button>
          <Button variant="tertiary" onPress={() => setValue(null)}>
            Clear
          </Button>
        </div>
      </Showcase>
    );
  },
};

export const WithValidation: Story = {
  render: function WithValidationStory() {
    const [value, setValue] = useState<Time | null>(null);
    const minValue = new Time(9);
    const isInvalid = value !== null && value.compare(minValue) < 0;

    return (
      <Showcase title="With validation">
        <TimeField
          isRequired
          className="w-64"
          isInvalid={isInvalid}
          minValue={minValue}
          name="time"
          value={value}
          onChange={setValue}
        >
          <Label>Appointment time</Label>
          <TimeField.Group>
            <Segments />
          </TimeField.Group>
          {isInvalid ? (
            <FieldError>Appointments start at 9:00 AM</FieldError>
          ) : (
            <Description>Enter a time from 9:00 AM onwards</Description>
          )}
        </TimeField>
      </Showcase>
    );
  },
};

export const Granularity: Story = {
  render: () => (
    <Showcase title="Granularity">
      <TimeField
        className="w-64"
        defaultValue={new Time(8, 45, 12)}
        granularity="second"
        name="time"
      >
        <Label>Time with seconds</Label>
        <TimeField.Group>
          <Segments />
        </TimeField.Group>
      </TimeField>
    </Showcase>
  ),
};

export const HourCycle: Story = {
  render: () => (
    <Showcase title="Hour cycle">
      <TimeField className="w-64" defaultValue={new Time(15, 30)} hourCycle={12} name="time-12">
        <Label>12-hour clock</Label>
        <TimeField.Group>
          <Segments />
        </TimeField.Group>
      </TimeField>
      <TimeField className="w-64" defaultValue={new Time(15, 30)} hourCycle={24} name="time-24">
        <Label>24-hour clock</Label>
        <TimeField.Group>
          <Segments />
        </TimeField.Group>
      </TimeField>
    </Showcase>
  ),
};
