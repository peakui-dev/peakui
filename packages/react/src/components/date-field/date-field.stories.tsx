import type {DateValue} from "@internationalized/date";
import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ComponentProps, ReactNode} from "react";

import {getLocalTimeZone, parseDate, parseZonedDateTime, today} from "@internationalized/date";
import {useState} from "react";
import {I18nProvider} from "react-aria-components/I18nProvider";

import {Button} from "../button/index.ts";
import {Description} from "../description/index.ts";
import {FieldError} from "../field-error/index.ts";
import {Label} from "../label/index.ts";

import {DateField} from "./index.ts";

/*
 * Story-local glyph, inlined verbatim from @gravity-ui/icons (MIT) — this package does not depend
 * on that one; see THIRD-PARTY-NOTICES.md.
 */
const CalendarIcon = (props: ComponentProps<"svg">) => (
  <svg
    aria-hidden="true"
    className="size-4"
    fill="none"
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M5.25 5.497a.75.75 0 0 1-.75-.75V4A1.5 1.5 0 0 0 3 5.5v1h10v-1A1.5 1.5 0 0 0 11.5 4v.75a.75.75 0 0 1-1.5 0V4H6v.747a.75.75 0 0 1-.75.75M10 2.5H6v-.752a.75.75 0 1 0-1.5 0V2.5a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h7a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3v-.75a.75.75 0 0 0-1.5 0zM3 8v3.5A1.5 1.5 0 0 0 4.5 13h7a1.5 1.5 0 0 0 1.5-1.5V8z"
      fill="currentColor"
      fillRule="evenodd"
    />
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
  <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
);

const meta = {
  component: DateField,
  parameters: {
    layout: "padded",
  },
  title: "Components/DateField",
} satisfies Meta<typeof DateField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Showcase title="Default">
      <DateField className="w-64" name="date">
        <Label>Date</Label>
        <DateField.Group>
          <Segments />
        </DateField.Group>
      </DateField>
    </Showcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <Showcase title="Primary and secondary">
      <DateField className="w-64" name="primary-date">
        <Label>Primary</Label>
        <DateField.Group variant="primary">
          <Segments />
        </DateField.Group>
      </DateField>
      <DateField className="w-64" name="secondary-date">
        <Label>Secondary</Label>
        <DateField.Group variant="secondary">
          <Segments />
        </DateField.Group>
      </DateField>
    </Showcase>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <Showcase title="Full width">
      <DateField fullWidth name="date">
        <Label>Date</Label>
        <DateField.Group fullWidth>
          <DateField.Prefix>
            <CalendarIcon />
          </DateField.Prefix>
          <Segments />
        </DateField.Group>
      </DateField>
    </Showcase>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Showcase title="With a description">
      <DateField className="w-64" name="birth-date">
        <Label>Birth date</Label>
        <DateField.Group>
          <Segments />
        </DateField.Group>
        <Description>Enter your date of birth</Description>
      </DateField>
    </Showcase>
  ),
};

export const Required: Story = {
  render: () => (
    <Showcase title="Required">
      <DateField isRequired className="w-64" name="date">
        <Label>Start date</Label>
        <DateField.Group>
          <Segments />
        </DateField.Group>
        <Description>Required field</Description>
      </DateField>
    </Showcase>
  ),
};

export const Invalid: Story = {
  render: () => (
    <Showcase title="Invalid">
      <DateField isInvalid className="w-64" name="date">
        <Label>Date</Label>
        <DateField.Group>
          <Segments />
        </DateField.Group>
        <FieldError>Date must be in the future</FieldError>
      </DateField>
    </Showcase>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Showcase title="Disabled">
      <DateField isDisabled className="w-64" defaultValue={parseDate("2026-08-15")} name="date">
        <Label>Date</Label>
        <DateField.Group>
          <Segments />
        </DateField.Group>
        <Description>This date field is disabled</Description>
      </DateField>
    </Showcase>
  ),
};

export const WithPrefixAndSuffix: Story = {
  render: () => (
    <Showcase title="With a prefix and a suffix">
      <DateField className="w-64" name="date">
        <Label>Date</Label>
        <DateField.Group>
          <DateField.Prefix>
            <CalendarIcon />
          </DateField.Prefix>
          <Segments />
          <DateField.Suffix>UTC</DateField.Suffix>
        </DateField.Group>
      </DateField>
    </Showcase>
  ),
};

export const Controlled: Story = {
  render: function ControlledStory() {
    const [value, setValue] = useState<DateValue | null>(null);

    return (
      <Showcase title="Controlled">
        <DateField className="w-64" name="date" value={value} onChange={setValue}>
          <Label>Date</Label>
          <DateField.Group>
            <Segments />
          </DateField.Group>
          <Description>Current value: {value ? value.toString() : "(empty)"}</Description>
        </DateField>
        <div className="flex gap-2">
          <Button variant="tertiary" onPress={() => setValue(today(getLocalTimeZone()))}>
            Set today
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
    const [value, setValue] = useState<DateValue | null>(null);
    const todayDate = today(getLocalTimeZone());
    const isInvalid = value !== null && value.compare(todayDate) < 0;

    return (
      <Showcase title="With validation">
        <DateField
          isRequired
          className="w-64"
          isInvalid={isInvalid}
          minValue={todayDate}
          name="date"
          value={value}
          onChange={setValue}
        >
          <Label>Date</Label>
          <DateField.Group>
            <Segments />
          </DateField.Group>
          {isInvalid ? (
            <FieldError>Date must be today or in the future</FieldError>
          ) : (
            <Description>Enter a date from today onwards</Description>
          )}
        </DateField>
      </Showcase>
    );
  },
};

export const Granularity: Story = {
  render: () => (
    <Showcase title="Granularity">
      <DateField
        className="w-72"
        defaultValue={parseZonedDateTime("2026-02-03T08:45:00[America/Los_Angeles]")}
        granularity="second"
        name="date-time"
      >
        <Label>Appointment</Label>
        <DateField.Group>
          <DateField.InputContainer>
            <Segments />
          </DateField.InputContainer>
        </DateField.Group>
      </DateField>
    </Showcase>
  ),
};

export const Locales: Story = {
  render: () => (
    <Showcase title="Locales and calendars">
      {[
        {label: "English (US)", locale: "en-US"},
        {label: "German", locale: "de-DE"},
        {label: "Japanese, Japanese calendar", locale: "ja-JP-u-ca-japanese"},
        {label: "Arabic (Egypt)", locale: "ar-EG"},
        {label: "Thai, Buddhist calendar", locale: "th-TH-u-ca-buddhist"},
      ].map(({label, locale}) => (
        <I18nProvider key={locale} locale={locale}>
          <DateField className="w-72" defaultValue={parseDate("2026-08-15")} name={locale}>
            <Label>{label}</Label>
            <DateField.Group>
              <Segments />
            </DateField.Group>
          </DateField>
        </I18nProvider>
      ))}
    </Showcase>
  ),
};
