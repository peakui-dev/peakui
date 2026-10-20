import type {DateValue} from "@internationalized/date";
import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ComponentProps, ReactNode} from "react";

import {getLocalTimeZone, parseDate, parseZonedDateTime, today} from "@internationalized/date";
import {useState} from "react";
import {I18nProvider} from "react-aria-components/I18nProvider";

import {Button} from "../button/index.ts";
import {Calendar} from "../calendar/index.ts";
import {DateField} from "../date-field/index.ts";
import {Description} from "../description/index.ts";
import {FieldError} from "../field-error/index.ts";
import {Form} from "../form/index.ts";
import {Label} from "../label/index.ts";

import {DatePicker} from "./index.ts";

/*
 * Story-local glyph, inlined verbatim from @gravity-ui/icons (MIT) — this package does not depend
 * on that one; see THIRD-PARTY-NOTICES.md.
 */
const ChevronDownIcon = (props: ComponentProps<"svg">) => (
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
      d="M2.97 5.47a.75.75 0 0 1 1.06 0L8 9.44l3.97-3.97a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 0-1.06"
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

const meta = {
  argTypes: {
    isDisabled: {control: "boolean"},
    isReadOnly: {control: "boolean"},
    isRequired: {control: "boolean"},
  },
  component: DatePicker,
  parameters: {
    layout: "padded",
  },
  title: "Components/DatePicker",
} satisfies Meta<typeof DatePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

/* The calendar a picker opens, with the year picker in the header. */
const CalendarContent = () => (
  <Calendar aria-label="Date">
    <Calendar.Header>
      <Calendar.YearPickerTrigger>
        <Calendar.YearPickerTriggerHeading />
        <Calendar.YearPickerTriggerIndicator />
      </Calendar.YearPickerTrigger>
      <Calendar.NavButton slot="previous" />
      <Calendar.NavButton slot="next" />
    </Calendar.Header>
    <Calendar.Grid>
      <Calendar.GridHeader>
        {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
      </Calendar.GridHeader>
      <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
    </Calendar.Grid>
    <Calendar.YearPickerGrid>
      <Calendar.YearPickerGridBody>
        {({year}) => <Calendar.YearPickerCell year={year} />}
      </Calendar.YearPickerGridBody>
    </Calendar.YearPickerGrid>
  </Calendar>
);

const Field = ({indicator}: {indicator?: ReactNode}) => (
  <DateField.Group fullWidth>
    <DateField.InputContainer>
      <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
    </DateField.InputContainer>
    <DateField.Suffix>
      <DatePicker.Trigger>
        <DatePicker.TriggerIndicator>{indicator}</DatePicker.TriggerIndicator>
      </DatePicker.Trigger>
    </DateField.Suffix>
  </DateField.Group>
);

export const Default: Story = {
  render: (args) => (
    <Showcase title="Default">
      <DatePicker {...args} className="w-64" name="date">
        <Label>Date</Label>
        <Field />
        <DatePicker.Popover>
          <CalendarContent />
        </DatePicker.Popover>
      </DatePicker>
    </Showcase>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Showcase title="With a description">
      <DatePicker className="w-64" name="date">
        <Label>Date</Label>
        <Field />
        <Description>Select a date from the calendar.</Description>
        <DatePicker.Popover>
          <CalendarContent />
        </DatePicker.Popover>
      </DatePicker>
    </Showcase>
  ),
};

export const DefaultValue: Story = {
  render: () => (
    <Showcase title="Default value">
      <DatePicker className="w-64" defaultValue={parseDate("2026-08-15")} name="date">
        <Label>Date</Label>
        <Field />
        <DatePicker.Popover>
          <CalendarContent />
        </DatePicker.Popover>
      </DatePicker>
    </Showcase>
  ),
};

export const Controlled: Story = {
  render: function ControlledStory() {
    const [value, setValue] = useState<DateValue | null>(today(getLocalTimeZone()));

    return (
      <Showcase title="Controlled">
        <DatePicker className="w-64" name="date" value={value} onChange={setValue}>
          <Label>Date</Label>
          <Field />
          <Description>Current value: {value ? value.toString() : "(empty)"}</Description>
          <DatePicker.Popover>
            <CalendarContent />
          </DatePicker.Popover>
        </DatePicker>
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

export const Disabled: Story = {
  render: () => (
    <Showcase title="Disabled">
      <DatePicker isDisabled className="w-64" defaultValue={parseDate("2026-08-15")} name="date">
        <Label>Date</Label>
        <Field />
        <DatePicker.Popover>
          <CalendarContent />
        </DatePicker.Popover>
      </DatePicker>
    </Showcase>
  ),
};

export const Invalid: Story = {
  render: () => (
    <Showcase title="Invalid">
      <DatePicker isInvalid className="w-64" defaultValue={parseDate("2020-01-01")} name="date">
        <Label>Date</Label>
        <Field />
        <FieldError>Date must be in the future</FieldError>
        <DatePicker.Popover>
          <CalendarContent />
        </DatePicker.Popover>
      </DatePicker>
    </Showcase>
  ),
};

export const WithValidation: Story = {
  render: function WithValidationStory() {
    const [value, setValue] = useState<DateValue | null>(null);
    const minValue = today(getLocalTimeZone());
    const isInvalid = value !== null && value.compare(minValue) < 0;

    return (
      <Showcase title="With validation">
        <DatePicker
          isRequired
          className="w-64"
          isInvalid={isInvalid}
          minValue={minValue}
          name="date"
          value={value}
          onChange={setValue}
        >
          <Label>Appointment date</Label>
          <Field />
          {isInvalid ? (
            <FieldError>Date must be today or in the future</FieldError>
          ) : (
            <Description>Select a date from today onwards</Description>
          )}
          <DatePicker.Popover>
            <CalendarContent />
          </DatePicker.Popover>
        </DatePicker>
      </Showcase>
    );
  },
};

export const CustomIndicator: Story = {
  render: () => (
    <Showcase title="Custom indicator">
      <DatePicker className="w-64" name="date">
        <Label>Date</Label>
        <Field indicator={<ChevronDownIcon />} />
        <DatePicker.Popover>
          <CalendarContent />
        </DatePicker.Popover>
      </DatePicker>
    </Showcase>
  ),
};

export const Granularity: Story = {
  render: () => (
    <Showcase title="Granularity">
      <DatePicker
        className="w-80"
        defaultValue={parseZonedDateTime("2026-02-03T08:45:00[America/Los_Angeles]")}
        granularity="minute"
        name="date-time"
      >
        <Label>Appointment</Label>
        <Field />
        <DatePicker.Popover>
          <CalendarContent />
        </DatePicker.Popover>
      </DatePicker>
    </Showcase>
  ),
};

export const Locales: Story = {
  render: () => (
    <Showcase title="Locales and calendars">
      {[
        {label: "German", locale: "de-DE"},
        {label: "Japanese, Japanese calendar", locale: "ja-JP-u-ca-japanese"},
        {label: "Arabic (Egypt)", locale: "ar-EG"},
      ].map(({label, locale}) => (
        <I18nProvider key={locale} locale={locale}>
          <DatePicker className="w-72" defaultValue={parseDate("2026-08-15")} name={locale}>
            <Label>{label}</Label>
            <Field />
            <DatePicker.Popover>
              <CalendarContent />
            </DatePicker.Popover>
          </DatePicker>
        </I18nProvider>
      ))}
    </Showcase>
  ),
};

export const InForm: Story = {
  render: function InFormStory() {
    const [value, setValue] = useState<DateValue | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
      <Showcase title="In a form">
        <Form
          className="flex w-64 flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setIsSubmitting(true);
            setTimeout(() => {
              setValue(null);
              setIsSubmitting(false);
            }, 1200);
          }}
        >
          <DatePicker isRequired name="appointmentDate" value={value} onChange={setValue}>
            <Label>Appointment date</Label>
            <Field />
            <FieldError />
            <DatePicker.Popover>
              <CalendarContent />
            </DatePicker.Popover>
          </DatePicker>
          <Button isPending={isSubmitting} type="submit">
            Submit
          </Button>
        </Form>
      </Showcase>
    );
  },
};
