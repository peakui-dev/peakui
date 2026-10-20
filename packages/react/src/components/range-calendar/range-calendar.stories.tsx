import type {RangeCalendarProps} from "./index.ts";
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

import {RangeCalendar} from "./index.ts";

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
  },
  component: RangeCalendar,
  parameters: {
    layout: "padded",
  },
  title: "Components/RangeCalendar",
} satisfies Meta<typeof RangeCalendar>;

export default meta;

type Story = StoryObj<typeof meta>;

type RangeCalendarTemplateProps = Omit<RangeCalendarProps, "children">;

/*
 * The parts in their usual order. Stories that change the anatomy write it out instead.
 */
const RangeCalendarTemplate = (props: RangeCalendarTemplateProps) => (
  <RangeCalendar {...props}>
    <RangeCalendar.Header>
      <RangeCalendar.Heading />
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
  </RangeCalendar>
);

const YearPickerTemplate = (props: RangeCalendarTemplateProps) => (
  <RangeCalendar {...props}>
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

interface DateRange {
  end: DateValue;
  start: DateValue;
}

export const Default: Story = {
  render: (args) => (
    <Showcase title="Default">
      <RangeCalendarTemplate {...args} aria-label="Trip dates" />
    </Showcase>
  ),
};

export const WithYearPicker: Story = {
  render: (args) => (
    <Showcase title="With year picker">
      <YearPickerTemplate {...args} aria-label="Trip dates" />
    </Showcase>
  ),
};

export const DefaultValue: Story = {
  render: (args) => (
    <Showcase title="Default value">
      <RangeCalendarTemplate
        {...args}
        aria-label="Trip dates"
        defaultValue={{end: parseDate("2025-02-20"), start: parseDate("2025-02-10")}}
      />
    </Showcase>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState<DateRange | null>(null);
    const [focusedDate, setFocusedDate] = useState<DateValue>(parseDate("2025-12-25"));

    return (
      <Showcase title="Controlled">
        <RangeCalendarTemplate
          aria-label="Trip dates"
          focusedValue={focusedDate}
          value={value}
          onChange={setValue}
          onFocusChange={setFocusedDate}
        />
        <Description>
          {value ? `${value.start.toString()} to ${value.end.toString()}` : "No range selected"}
        </Description>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              const now = today(getLocalTimeZone());

              setValue({end: now.add({days: 6}), start: now});
              setFocusedDate(now);
            }}
          >
            Next 7 days
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              const start = startOfMonth(today(getLocalTimeZone()).add({months: 1}));

              setValue({end: start.add({days: 6}), start});
              setFocusedDate(start);
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
          aria-label="Trip dates"
          maxValue={maxDate}
          minValue={minDate}
        />
        <Description>Select dates between today and {maxDate.toString()}</Description>
      </Showcase>
    );
  },
};

export const UnavailableDates: Story = {
  render: (args) => {
    const {locale} = useLocale();

    return (
      <Showcase title="Unavailable dates">
        <RangeCalendarTemplate
          {...args}
          aria-label="Trip dates"
          isDateUnavailable={(date) => isWeekend(date, locale)}
        />
        <Description>Weekends are unavailable, so a range cannot cross one</Description>
      </Showcase>
    );
  },
};

export const AnchorUnavailableDates: Story = {
  render: (args) => (
    <Showcase title="Anchor-based unavailable dates">
      <RangeCalendarTemplate
        {...args}
        aria-label="Trip dates"
        minValue={today(getLocalTimeZone())}
        isDateUnavailable={(date, anchorDate) =>
          anchorDate != null && Math.abs(date.compare(anchorDate)) > 7
        }
      />
      <Description>After the first date is chosen, only 7 days either side remain</Description>
    </Showcase>
  ),
};

export const NonContiguousRanges: Story = {
  render: (args) => {
    const now = today(getLocalTimeZone());
    const blocked = [
      [now.add({days: 2}), now.add({days: 5})],
      [now.add({days: 12}), now.add({days: 13})],
    ] as const;

    return (
      <Showcase title="Non-contiguous ranges">
        <RangeCalendarTemplate
          {...args}
          allowsNonContiguousRanges
          aria-label="Trip dates"
          defaultValue={{end: now.add({days: 9}), start: now.add({days: 1})}}
          isDateUnavailable={(date) =>
            blocked.some(([start, end]) => date.compare(start) >= 0 && date.compare(end) <= 0)
          }
        />
        <Description>A range may span unavailable dates</Description>
      </Showcase>
    );
  },
};

export const WeeksInMonth: Story = {
  render: (args) => (
    <Showcase title="Weeks in month">
      <RangeCalendarTemplate {...args} aria-label="Trip dates" weeksInMonth={6} />
      <Description>Six weeks per month keep the height from shifting</Description>
    </Showcase>
  ),
};

export const Disabled: Story = {
  render: (args) => (
    <Showcase title="Disabled">
      <RangeCalendarTemplate
        {...args}
        isDisabled
        aria-label="Trip dates"
        defaultValue={{
          end: today(getLocalTimeZone()).add({days: 4}),
          start: today(getLocalTimeZone()),
        }}
      />
    </Showcase>
  ),
};

export const ReadOnly: Story = {
  render: (args) => (
    <Showcase title="Read only">
      <RangeCalendarTemplate
        {...args}
        isReadOnly
        aria-label="Trip dates"
        defaultValue={{
          end: today(getLocalTimeZone()).add({days: 4}),
          start: today(getLocalTimeZone()),
        }}
      />
    </Showcase>
  ),
};

export const Invalid: Story = {
  render: () => {
    const [value, setValue] = useState<DateRange | null>({
      end: parseDate("2025-01-20"),
      start: parseDate("2025-01-15"),
    });
    const isInvalid = value !== null && value.start.compare(today(getLocalTimeZone())) < 0;

    return (
      <Showcase title="Invalid">
        <RangeCalendarTemplate
          aria-label="Trip dates"
          isInvalid={isInvalid}
          value={value}
          onChange={setValue}
        />
        <Description>
          {isInvalid ? "The range must start today or later" : "Select a range from today on"}
        </Description>
      </Showcase>
    );
  },
};

const DATES_WITH_EVENTS = [3, 7, 12, 15, 21, 28];

export const WithIndicators: Story = {
  render: (args) => (
    <Showcase title="With indicators">
      <RangeCalendar {...args} aria-label="Trip dates">
        <RangeCalendar.Header>
          <RangeCalendar.NavButton slot="previous" />
          <RangeCalendar.Heading />
          <RangeCalendar.NavButton slot="next" />
        </RangeCalendar.Header>
        <RangeCalendar.Grid>
          <RangeCalendar.GridHeader>
            {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
          </RangeCalendar.GridHeader>
          <RangeCalendar.GridBody>
            {(date) => (
              <RangeCalendar.Cell date={date}>
                {({formattedDate}) => (
                  <>
                    {formattedDate}
                    {(isToday(date, getLocalTimeZone()) ||
                      DATES_WITH_EVENTS.includes(date.day)) && <RangeCalendar.CellIndicator />}
                  </>
                )}
              </RangeCalendar.Cell>
            )}
          </RangeCalendar.GridBody>
        </RangeCalendar.Grid>
      </RangeCalendar>
    </Showcase>
  ),
};

export const MultipleMonths: Story = {
  render: (args) => (
    <Showcase title="Multiple months">
      <RangeCalendar
        {...args}
        aria-label="Trip dates"
        className="w-auto max-w-none"
        visibleDuration={{months: 2}}
      >
        <div className="flex w-max gap-8">
          <div className="w-64">
            <RangeCalendar.Header>
              <RangeCalendar.NavButton slot="previous" />
              <RangeCalendar.Heading className="flex-none" />
              <div className="size-6" />
            </RangeCalendar.Header>
            <RangeCalendar.Grid>
              <RangeCalendar.GridHeader>
                {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
              </RangeCalendar.GridHeader>
              <RangeCalendar.GridBody>
                {(date) => <RangeCalendar.Cell date={date} />}
              </RangeCalendar.GridBody>
            </RangeCalendar.Grid>
          </div>
          <div className="w-64">
            <RangeCalendar.Header>
              <div className="size-6" />
              <RangeCalendar.Heading className="flex-none" offset={{months: 1}} />
              <RangeCalendar.NavButton slot="next" />
            </RangeCalendar.Header>
            <RangeCalendar.Grid offset={{months: 1}}>
              <RangeCalendar.GridHeader>
                {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
              </RangeCalendar.GridHeader>
              <RangeCalendar.GridBody>
                {(date) => <RangeCalendar.Cell date={date} />}
              </RangeCalendar.GridBody>
            </RangeCalendar.Grid>
          </div>
        </div>
      </RangeCalendar>
    </Showcase>
  ),
};

const DAY_OPTIONS = [1, 5, 7, 8, 10, 14, 21];
const WEEK_OPTIONS = [1, 2, 3, 4, 5, 6, 8];

/*
 * One select drives both duration stories: the visible duration is the only thing that differs.
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
        <RangeCalendarTemplate {...args} aria-label="Day view" visibleDuration={{days}} />
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
        <RangeCalendarTemplate {...args} aria-label="Week view" visibleDuration={{weeks}} />
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
                defaultValue={{
                  end: today(getLocalTimeZone()).add({days: 5}),
                  start: today(getLocalTimeZone()),
                }}
              />
            </div>
          </I18nProvider>
        ))}
      </div>
    </Showcase>
  ),
};
