import type {CalendarProps, CalendarSelectionMode} from "./index.ts";
import type {DateValue} from "@internationalized/date";
import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {
  getLocalTimeZone,
  isToday,
  isWeekend,
  parseDate,
  startOfMonth,
  today,
} from "@internationalized/date";
import {useState} from "react";
import {I18nProvider, useLocale} from "react-aria-components/I18nProvider";

import {Button} from "../button/index.ts";
import {Description} from "../description/index.ts";
import {Label} from "../label/index.ts";
import {ListBox} from "../list-box/index.ts";
import {Select} from "../select/index.ts";

import {Calendar} from "./index.ts";

/*
 * Every story carries a level-two heading: the audit in apps/storybook/e2e waits for it as the
 * sign that the preview is ready, and without it axe runs against an empty iframe and passes.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col items-start gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    {children}
  </div>
);

const meta = {
  argTypes: {
    isDisabled: {control: "boolean"},
    isReadOnly: {control: "boolean"},
    selectionMode: {control: "select", options: ["single", "multiple"]},
  },
  component: Calendar,
  parameters: {
    layout: "padded",
  },
  title: "Components/Calendar",
} satisfies Meta<typeof Calendar>;

export default meta;

type Story = StoryObj<typeof meta>;

type CalendarTemplateProps<M extends CalendarSelectionMode = "single"> = Omit<
  CalendarProps<DateValue, M>,
  "children"
>;

/*
 * The parts in their usual order. Stories that change the anatomy write it out instead.
 */
const CalendarTemplate = <M extends CalendarSelectionMode = "single">(
  props: CalendarTemplateProps<M>,
) => (
  <Calendar {...props}>
    <Calendar.Header>
      <Calendar.Heading />
      <Calendar.NavButton slot="previous" />
      <Calendar.NavButton slot="next" />
    </Calendar.Header>
    <Calendar.Grid>
      <Calendar.GridHeader>
        {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
      </Calendar.GridHeader>
      <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
    </Calendar.Grid>
  </Calendar>
);

const YearPickerTemplate = <M extends CalendarSelectionMode = "single">(
  props: CalendarTemplateProps<M>,
) => (
  <Calendar {...props}>
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

export const Default: Story = {
  render: (args) => (
    <Showcase title="Default">
      <CalendarTemplate {...args} aria-label="Event date" />
    </Showcase>
  ),
};

export const WithYearPicker: Story = {
  render: (args) => (
    <Showcase title="With year picker">
      <YearPickerTemplate {...args} aria-label="Event date" />
    </Showcase>
  ),
};

export const DefaultValue: Story = {
  render: (args) => (
    <Showcase title="Default value">
      <CalendarTemplate {...args} aria-label="Event date" defaultValue={parseDate("2025-02-14")} />
    </Showcase>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState<DateValue | null>(null);
    const [focusedDate, setFocusedDate] = useState<DateValue>(parseDate("2025-12-25"));

    return (
      <Showcase title="Controlled">
        <CalendarTemplate
          aria-label="Event date"
          focusedValue={focusedDate}
          value={value}
          onChange={setValue}
          onFocusChange={setFocusedDate}
        />
        <Description>Selected date: {value ? value.toString() : "none"}</Description>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              const todayDate = today(getLocalTimeZone());

              setValue(todayDate);
              setFocusedDate(todayDate);
            }}
          >
            Today
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              const nextMonth = startOfMonth(today(getLocalTimeZone()).add({months: 1}));

              setValue(nextMonth);
              setFocusedDate(nextMonth);
            }}
          >
            Next month
          </Button>
          <Button size="sm" variant="tertiary" onPress={() => setValue(null)}>
            Clear
          </Button>
        </div>
      </Showcase>
    );
  },
};

export const MinMaxDates: Story = {
  render: (args) => {
    const minDate = today(getLocalTimeZone());
    const maxDate = minDate.add({months: 3});

    return (
      <Showcase title="Min and max dates">
        <YearPickerTemplate
          {...args}
          aria-label="Appointment date"
          maxValue={maxDate}
          minValue={minDate}
        />
        <Description>Select a date between today and {maxDate.toString()}</Description>
      </Showcase>
    );
  },
};

export const UnavailableDates: Story = {
  render: (args) => {
    const {locale} = useLocale();

    return (
      <Showcase title="Unavailable dates">
        <CalendarTemplate
          {...args}
          aria-label="Appointment date"
          isDateUnavailable={(date) => isWeekend(date, locale)}
        />
        <Description>Weekends are unavailable</Description>
      </Showcase>
    );
  },
};

export const WeeksInMonth: Story = {
  render: (args) => (
    <Showcase title="Weeks in month">
      <CalendarTemplate {...args} aria-label="Event date" weeksInMonth={6} />
      <Description>Six weeks per month keep the height from shifting</Description>
    </Showcase>
  ),
};

export const MultipleSelection: Story = {
  render: () => {
    const [value, setValue] = useState<readonly DateValue[]>([]);

    return (
      <Showcase title="Multiple selection">
        <CalendarTemplate
          aria-label="Event dates"
          selectionMode="multiple"
          value={value}
          onChange={setValue}
        />
        <Description>
          {value.length ? `${value.length} selected` : "Select several dates"}
        </Description>
      </Showcase>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <Showcase title="Disabled">
      <CalendarTemplate
        isDisabled
        aria-label="Event date"
        defaultValue={today(getLocalTimeZone())}
      />
    </Showcase>
  ),
};

export const ReadOnly: Story = {
  render: (args) => (
    <Showcase title="Read only">
      <CalendarTemplate
        {...args}
        isReadOnly
        aria-label="Event date"
        defaultValue={today(getLocalTimeZone())}
      />
    </Showcase>
  ),
};

export const Invalid: Story = {
  render: () => {
    const [value, setValue] = useState<DateValue | null>(parseDate("2025-01-15"));
    const isInvalid = value !== null && value.compare(today(getLocalTimeZone())) < 0;

    return (
      <Showcase title="Invalid">
        <CalendarTemplate
          aria-label="Event date"
          isInvalid={isInvalid}
          value={value}
          onChange={setValue}
        />
        <Description>
          {isInvalid ? "The date must be today or later" : "Select a date from today on"}
        </Description>
      </Showcase>
    );
  },
};

const DATES_WITH_EVENTS = [3, 7, 12, 15, 21, 28];

export const WithIndicators: Story = {
  render: (args) => (
    <Showcase title="With indicators">
      <Calendar {...args} aria-label="Event date">
        <Calendar.Header>
          <Calendar.NavButton slot="previous" />
          <Calendar.Heading />
          <Calendar.NavButton slot="next" />
        </Calendar.Header>
        <Calendar.Grid>
          <Calendar.GridHeader>
            {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
          </Calendar.GridHeader>
          <Calendar.GridBody>
            {(date) => (
              <Calendar.Cell date={date}>
                {({formattedDate}) => (
                  <>
                    {formattedDate}
                    {(isToday(date, getLocalTimeZone()) ||
                      DATES_WITH_EVENTS.includes(date.day)) && <Calendar.CellIndicator />}
                  </>
                )}
              </Calendar.Cell>
            )}
          </Calendar.GridBody>
        </Calendar.Grid>
      </Calendar>
    </Showcase>
  ),
};

export const MultipleMonths: Story = {
  render: (args) => (
    <Showcase title="Multiple months">
      <Calendar
        {...args}
        aria-label="Trip dates"
        className="w-auto max-w-none"
        visibleDuration={{months: 2}}
      >
        <div className="flex w-max gap-8">
          <div className="w-64">
            <Calendar.Header>
              <Calendar.NavButton slot="previous" />
              <Calendar.Heading className="flex-none" />
              <div className="size-6" />
            </Calendar.Header>
            <Calendar.Grid>
              <Calendar.GridHeader>
                {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
              </Calendar.GridHeader>
              <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
            </Calendar.Grid>
          </div>
          <div className="w-64">
            <Calendar.Header>
              <div className="size-6" />
              <Calendar.Heading className="flex-none" offset={{months: 1}} />
              <Calendar.NavButton slot="next" />
            </Calendar.Header>
            <Calendar.Grid offset={{months: 1}}>
              <Calendar.GridHeader>
                {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
              </Calendar.GridHeader>
              <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
            </Calendar.Grid>
          </div>
        </div>
      </Calendar>
    </Showcase>
  ),
};

const DAY_OPTIONS = [1, 5, 7, 8, 10, 14, 21];
const WEEK_OPTIONS = [1, 2, 3, 4, 5, 6, 8];

/*
 * One select drives both range stories: the visible duration is the only thing that differs.
 */
const DurationSelect = ({
  label,
  onChange,
  options,
  unit,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  options: number[];
  unit: string;
  value: number;
}) => (
  <Select
    className="w-40"
    value={String(value)}
    onChange={(next) => next && onChange(Number(next))}
  >
    <Label>{label}</Label>
    <Select.Trigger>
      <Select.Value />
      <Select.Indicator />
    </Select.Trigger>
    <Select.Popover>
      <ListBox>
        {options.map((option) => (
          <ListBox.Item key={option} id={String(option)} textValue={`${option} ${unit}`}>
            {option} {unit}
            <ListBox.ItemIndicator />
          </ListBox.Item>
        ))}
      </ListBox>
    </Select.Popover>
  </Select>
);

export const DayView: Story = {
  render: (args) => {
    const [days, setDays] = useState(5);

    return (
      <Showcase title="Day view">
        <DurationSelect
          label="Visible days"
          options={DAY_OPTIONS}
          unit="days"
          value={days}
          onChange={setDays}
        />
        <CalendarTemplate {...args} aria-label="Day view" visibleDuration={{days}} />
      </Showcase>
    );
  },
};

export const WeekView: Story = {
  render: (args) => {
    const [weeks, setWeeks] = useState(1);

    return (
      <Showcase title="Week view">
        <DurationSelect
          label="Visible weeks"
          options={WEEK_OPTIONS}
          unit="weeks"
          value={weeks}
          onChange={setWeeks}
        />
        <CalendarTemplate {...args} aria-label="Week view" visibleDuration={{weeks}} />
      </Showcase>
    );
  },
};

/*
 * The locale picks the calendar system, the first day of the week and the digits. The year
 * picker spans the years of that system.
 */
const LOCALES = [
  {label: "Indian", locale: "hi-IN-u-ca-indian"},
  {label: "Japanese", locale: "ja-JP-u-ca-japanese"},
  {label: "Hebrew", locale: "he-IL-u-ca-hebrew"},
  {label: "Persian", locale: "fa-IR-u-ca-persian"},
  {label: "Arabic (right to left)", locale: "ar-EG"},
];

export const InternationalCalendars: Story = {
  render: (args) => (
    <Showcase title="International calendars">
      <div className="flex flex-wrap gap-8">
        {LOCALES.map(({label, locale}) => (
          <I18nProvider key={locale} locale={locale}>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted">{label}</span>
              <YearPickerTemplate
                {...args}
                aria-label={label}
                defaultValue={today(getLocalTimeZone())}
              />
            </div>
          </I18nProvider>
        ))}
      </div>
    </Showcase>
  ),
};

export const CustomNavIcons: Story = {
  render: (args) => (
    <Showcase title="Custom navigation icons">
      <Calendar {...args} aria-label="Event date">
        <Calendar.Header>
          <Calendar.NavButton slot="previous">
            <svg aria-hidden height={24} viewBox="0 0 24 24" width={24}>
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6l6 6z" fill="currentColor" />
            </svg>
          </Calendar.NavButton>
          <Calendar.Heading />
          <Calendar.NavButton slot="next">
            <svg aria-hidden height={24} viewBox="0 0 24 24" width={24}>
              <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6l6 6l-6 6z" fill="currentColor" />
            </svg>
          </Calendar.NavButton>
        </Calendar.Header>
        <Calendar.Grid>
          <Calendar.GridHeader>
            {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
          </Calendar.GridHeader>
          <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
        </Calendar.Grid>
      </Calendar>
    </Showcase>
  ),
};
