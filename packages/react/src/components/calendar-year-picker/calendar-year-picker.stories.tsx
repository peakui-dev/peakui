import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Calendar} from "../calendar/index.ts";

import {CalendarYearPicker} from "./index.ts";

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

/*
 * The year picker is an internal part: it renders only inside a Calendar (or RangeCalendar),
 * which provides the state and the open flag. The stories host it in a Calendar.
 */
const meta = {
  component: CalendarYearPicker.GridBody,
  parameters: {
    layout: "padded",
  },
  title: "Components/CalendarYearPicker",
} satisfies Meta<typeof CalendarYearPicker.GridBody>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Showcase title="Default">
      <Calendar aria-label="Event date">
        <Calendar.Header>
          <CalendarYearPicker.Trigger>
            <CalendarYearPicker.TriggerHeading />
            <CalendarYearPicker.TriggerIndicator />
          </CalendarYearPicker.Trigger>
          <Calendar.NavButton slot="previous" />
          <Calendar.NavButton slot="next" />
        </Calendar.Header>
        <Calendar.Grid>
          <Calendar.GridHeader>
            {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
          </Calendar.GridHeader>
          <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
        </Calendar.Grid>
        <CalendarYearPicker.Grid>
          <CalendarYearPicker.GridBody />
        </CalendarYearPicker.Grid>
      </Calendar>
    </Showcase>
  ),
};

export const Open: Story = {
  render: () => (
    <Showcase title="Open">
      <Calendar defaultYearPickerOpen aria-label="Event date">
        <Calendar.Header>
          <CalendarYearPicker.Trigger>
            <CalendarYearPicker.TriggerHeading />
            <CalendarYearPicker.TriggerIndicator />
          </CalendarYearPicker.Trigger>
          <Calendar.NavButton slot="previous" />
          <Calendar.NavButton slot="next" />
        </Calendar.Header>
        <Calendar.Grid>
          <Calendar.GridHeader>
            {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
          </Calendar.GridHeader>
          <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
        </Calendar.Grid>
        <CalendarYearPicker.Grid>
          <CalendarYearPicker.GridBody />
        </CalendarYearPicker.Grid>
      </Calendar>
    </Showcase>
  ),
};

export const CurrentYearMarked: Story = {
  render: () => (
    <Showcase title="Current year marked">
      <Calendar defaultYearPickerOpen aria-label="Event date">
        <Calendar.Header>
          <CalendarYearPicker.Trigger>
            <CalendarYearPicker.TriggerHeading />
            <CalendarYearPicker.TriggerIndicator />
          </CalendarYearPicker.Trigger>
        </Calendar.Header>
        <Calendar.Grid>
          <Calendar.GridHeader>
            {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
          </Calendar.GridHeader>
          <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
        </Calendar.Grid>
        <CalendarYearPicker.Grid>
          <CalendarYearPicker.GridBody>
            {({isCurrentYear, year}) => (
              <CalendarYearPicker.Cell year={year}>
                {({formattedYear}) => (
                  <span className="inline-flex items-center gap-1">
                    {formattedYear}
                    {isCurrentYear ? <span className="text-xs">now</span> : null}
                  </span>
                )}
              </CalendarYearPicker.Cell>
            )}
          </CalendarYearPicker.GridBody>
        </CalendarYearPicker.Grid>
      </Calendar>
    </Showcase>
  ),
};
