import type {DateValue} from "@internationalized/date";
import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ComponentProps, ReactNode} from "react";
import type {RangeValue} from "react-aria-components/RangeCalendar";

import {getLocalTimeZone, parseDate, today} from "@internationalized/date";
import {useState} from "react";
import {I18nProvider} from "react-aria-components/I18nProvider";

import {Button} from "../button/index.ts";
import {DateField} from "../date-field/index.ts";
import {Description} from "../description/index.ts";
import {FieldError} from "../field-error/index.ts";
import {Form} from "../form/index.ts";
import {Label} from "../label/index.ts";
import {RangeCalendar} from "../range-calendar/index.ts";

import {DateRangePicker} from "./index.ts";

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
  component: DateRangePicker,
  parameters: {
    layout: "padded",
  },
  title: "Components/DateRangePicker",
} satisfies Meta<typeof DateRangePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

/* The calendar a range picker opens, with the year picker in the header. */
const RangeCalendarContent = () => (
  <RangeCalendar aria-label="Date range">
    <RangeCalendar.Header>
      <RangeCalendar.YearPickerTrigger>
        <RangeCalendar.YearPickerTriggerHeading />
        <RangeCalendar.YearPickerTriggerIndicator />
      </RangeCalendar.YearPickerTrigger>
      <RangeCalendar.NavButton slot="previous" />
      <RangeCalendar.NavButton slot="next" />
    </RangeCalendar.Header>
    <RangeCalendar.Grid>
      <RangeCalendar.GridHeader>
        {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
      </RangeCalendar.GridHeader>
      <RangeCalendar.GridBody>
        {(date) => <RangeCalendar.Cell date={date} />}
      </RangeCalendar.GridBody>
    </RangeCalendar.Grid>
    <RangeCalendar.YearPickerGrid>
      <RangeCalendar.YearPickerGridBody>
        {({year}) => <RangeCalendar.YearPickerCell year={year} />}
      </RangeCalendar.YearPickerGridBody>
    </RangeCalendar.YearPickerGrid>
  </RangeCalendar>
);

const Field = ({indicator}: {indicator?: ReactNode}) => (
  <DateField.Group fullWidth>
    <DateField.Input slot="start">
      {(segment) => <DateField.Segment segment={segment} />}
    </DateField.Input>
    <DateRangePicker.RangeSeparator />
    <DateField.Input slot="end">
      {(segment) => <DateField.Segment segment={segment} />}
    </DateField.Input>
    <DateField.Suffix>
      <DateRangePicker.Trigger>
        <DateRangePicker.TriggerIndicator>{indicator}</DateRangePicker.TriggerIndicator>
      </DateRangePicker.Trigger>
    </DateField.Suffix>
  </DateField.Group>
);

const Popover = () => (
  <DateRangePicker.Popover>
    <RangeCalendarContent />
  </DateRangePicker.Popover>
);

const august = {end: parseDate("2026-08-18"), start: parseDate("2026-08-15")};

export const Default: Story = {
  render: (args) => (
    <Showcase title="Default">
      <DateRangePicker {...args} className="w-80" endName="end" startName="start">
        <Label>Trip dates</Label>
        <Field />
        <Popover />
      </DateRangePicker>
    </Showcase>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Showcase title="With a description">
      <DateRangePicker className="w-80" endName="end" startName="start">
        <Label>Trip dates</Label>
        <Field />
        <Description>Select your check-in and check-out dates.</Description>
        <Popover />
      </DateRangePicker>
    </Showcase>
  ),
};

export const DefaultValue: Story = {
  render: () => (
    <Showcase title="Default value">
      <DateRangePicker className="w-80" defaultValue={august} endName="end" startName="start">
        <Label>Trip dates</Label>
        <Field />
        <Popover />
      </DateRangePicker>
    </Showcase>
  ),
};

export const Controlled: Story = {
  render: function ControlledStory() {
    const start = today(getLocalTimeZone());
    const [value, setValue] = useState<RangeValue<DateValue> | null>({
      end: start.add({days: 4}),
      start,
    });

    return (
      <Showcase title="Controlled">
        <DateRangePicker
          className="w-80"
          endName="end"
          startName="start"
          value={value}
          onChange={setValue}
        >
          <Label>Trip dates</Label>
          <Field />
          <Description>
            Current value:{" "}
            {value ? `${value.start.toString()} to ${value.end.toString()}` : "(empty)"}
          </Description>
          <Popover />
        </DateRangePicker>
        <div className="flex gap-2">
          <Button variant="tertiary" onPress={() => setValue({end: start.add({days: 6}), start})}>
            Set this week
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
      <DateRangePicker
        isDisabled
        className="w-80"
        defaultValue={august}
        endName="end"
        startName="start"
      >
        <Label>Trip dates</Label>
        <Field />
        <Popover />
      </DateRangePicker>
    </Showcase>
  ),
};

export const Invalid: Story = {
  render: () => (
    <Showcase title="Invalid">
      <DateRangePicker
        isInvalid
        className="w-80"
        defaultValue={{end: parseDate("2020-01-10"), start: parseDate("2020-01-01")}}
        endName="end"
        startName="start"
      >
        <Label>Trip dates</Label>
        <Field />
        <FieldError>Dates must be in the future</FieldError>
        <Popover />
      </DateRangePicker>
    </Showcase>
  ),
};

export const WithValidation: Story = {
  render: function WithValidationStory() {
    const [value, setValue] = useState<RangeValue<DateValue> | null>(null);
    const minValue = today(getLocalTimeZone());
    const isInvalid = value !== null && value.start.compare(minValue) < 0;

    return (
      <Showcase title="With validation">
        <DateRangePicker
          isRequired
          className="w-80"
          endName="end"
          isInvalid={isInvalid}
          minValue={minValue}
          startName="start"
          value={value}
          onChange={setValue}
        >
          <Label>Trip dates</Label>
          <Field />
          {isInvalid ? (
            <FieldError>Dates must be today or in the future</FieldError>
          ) : (
            <Description>Select dates from today onwards</Description>
          )}
          <Popover />
        </DateRangePicker>
      </Showcase>
    );
  },
};

export const CustomIndicator: Story = {
  render: () => (
    <Showcase title="Custom indicator">
      <DateRangePicker className="w-80" endName="end" startName="start">
        <Label>Trip dates</Label>
        <Field indicator={<ChevronDownIcon />} />
        <Popover />
      </DateRangePicker>
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
          <DateRangePicker
            className="w-96"
            defaultValue={august}
            endName={`${locale}-end`}
            startName={`${locale}-start`}
          >
            <Label>{label}</Label>
            <Field />
            <Popover />
          </DateRangePicker>
        </I18nProvider>
      ))}
    </Showcase>
  ),
};

export const InForm: Story = {
  render: function InFormStory() {
    const [value, setValue] = useState<RangeValue<DateValue> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
      <Showcase title="In a form">
        <Form
          className="flex w-80 flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setIsSubmitting(true);
            setTimeout(() => {
              setValue(null);
              setIsSubmitting(false);
            }, 1200);
          }}
        >
          <DateRangePicker
            isRequired
            endName="checkOut"
            startName="checkIn"
            value={value}
            onChange={setValue}
          >
            <Label>Trip dates</Label>
            <Field />
            <FieldError />
            <Popover />
          </DateRangePicker>
          <Button isPending={isSubmitting} type="submit">
            Submit
          </Button>
        </Form>
      </Showcase>
    );
  },
};
