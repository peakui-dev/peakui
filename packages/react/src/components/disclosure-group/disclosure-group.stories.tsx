import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import React from "react";
import {cn} from "tailwind-variants";

import {Button} from "../button/index.ts";
import {Disclosure} from "../disclosure/index.ts";
import {IconCalendar, IconChevronDown, IconChevronUp, IconSearch} from "../icons.tsx";
import {Separator} from "../separator/index.ts";

import {DisclosureGroup, useDisclosureGroupNavigation} from "./index.ts";

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

/* A named component, not an inline render: hooks belong to a component, and lint wants to see it. */
const GroupExample = ({allowsMultipleExpanded = false}: {allowsMultipleExpanded?: boolean}) => {
  const [expandedKeys, setExpandedKeys] = React.useState(new Set<string | number>(["search"]));

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col gap-4 rounded-3xl bg-surface p-4">
        <DisclosureGroup
          allowsMultipleExpanded={allowsMultipleExpanded}
          expandedKeys={expandedKeys}
          onExpandedChange={setExpandedKeys}
        >
          <Disclosure aria-label="Параметры поиска" id="search">
            <Disclosure.Heading>
              <Button
                slot="trigger"
                variant={expandedKeys.has("search") ? "secondary" : "tertiary"}
                className={cn("w-full border-none", {
                  "bg-transparent": !expandedKeys.has("search"),
                })}
              >
                <div className="flex w-full items-center justify-start gap-2">
                  <IconSearch />
                  Параметры поиска
                </div>
                <Disclosure.Indicator className="text-muted" />
              </Button>
            </Disclosure.Heading>
            <Disclosure.Content>
              <Disclosure.Body className="mx-2 p-4 text-sm text-muted">
                Регистр, целые слова и регулярные выражения применяются к новому запросу.
              </Disclosure.Body>
            </Disclosure.Content>
          </Disclosure>
          <Separator className="my-2" />
          <Disclosure id="history">
            <Disclosure.Heading aria-label="История запросов">
              <Button
                slot="trigger"
                variant={expandedKeys.has("history") ? "secondary" : "tertiary"}
                className={cn("w-full border-none", {
                  "bg-transparent": !expandedKeys.has("history"),
                })}
              >
                <div className="flex w-full items-center justify-start gap-2">
                  <IconCalendar />
                  История запросов
                </div>
                <Disclosure.Indicator className="text-muted" />
              </Button>
            </Disclosure.Heading>
            <Disclosure.Content>
              <Disclosure.Body className="mx-2 p-4 text-sm text-muted">
                Последние запросы сохраняются локально и доступны только вам.
              </Disclosure.Body>
            </Disclosure.Content>
          </Disclosure>
        </DisclosureGroup>
      </div>
    </div>
  );
};

const ControlledExample = () => {
  const [expandedKeys, setExpandedKeys] = React.useState(new Set<string | number>(["search"]));
  const itemIds = ["search", "history"]; // Track our disclosure items

  const {isNextDisabled, isPrevDisabled, onNext, onPrevious} = useDisclosureGroupNavigation({
    expandedKeys,
    itemIds,
    onExpandedChange: setExpandedKeys,
  });

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col gap-4 rounded-3xl bg-surface p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Настройки поиска</h3>
          <div className="flex gap-2">
            <Button
              aria-label="Предыдущее раскрытие"
              isDisabled={isPrevDisabled}
              size="sm"
              variant="secondary"
              onPress={onPrevious}
            >
              <IconChevronUp className="size-4" />
            </Button>
            <Button
              aria-label="Следующее раскрытие"
              isDisabled={isNextDisabled}
              size="sm"
              variant="secondary"
              onPress={onNext}
            >
              <IconChevronDown className="size-4" />
            </Button>
          </div>
        </div>
        <DisclosureGroup expandedKeys={expandedKeys} onExpandedChange={setExpandedKeys}>
          <Disclosure aria-label="Параметры поиска" id="search">
            <Disclosure.Heading>
              <Button
                slot="trigger"
                variant={expandedKeys.has("search") ? "secondary" : "tertiary"}
                className={cn("w-full border-none", {
                  "bg-transparent": !expandedKeys.has("search"),
                })}
              >
                <div className="flex w-full items-center justify-start gap-2">
                  <IconSearch />
                  Параметры поиска
                </div>
                <Disclosure.Indicator className="text-muted" />
              </Button>
            </Disclosure.Heading>
            <Disclosure.Content>
              <Disclosure.Body className="mx-2 p-4 text-sm text-muted">
                Регистр, целые слова и регулярные выражения применяются к новому запросу.
              </Disclosure.Body>
            </Disclosure.Content>
          </Disclosure>
          <Separator className="my-2" />
          <Disclosure id="history">
            <Disclosure.Heading aria-label="История запросов">
              <Button
                slot="trigger"
                variant={expandedKeys.has("history") ? "secondary" : "tertiary"}
                className={cn("w-full border-none", {
                  "bg-transparent": !expandedKeys.has("history"),
                })}
              >
                <div className="flex w-full items-center justify-start gap-2">
                  <IconCalendar />
                  История запросов
                </div>
                <Disclosure.Indicator className="text-muted" />
              </Button>
            </Disclosure.Heading>
            <Disclosure.Content>
              <Disclosure.Body className="mx-2 p-4 text-sm text-muted">
                Последние запросы сохраняются локально и доступны только вам.
              </Disclosure.Body>
            </Disclosure.Content>
          </Disclosure>
        </DisclosureGroup>
      </div>
    </div>
  );
};

const meta = {
  component: DisclosureGroup,
  parameters: {
    layout: "padded",
  },
  title: "Components/DisclosureGroup",
} satisfies Meta<typeof DisclosureGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "По умолчанию",
  render: () => (
    <Showcase title="По умолчанию">
      <GroupExample />
    </Showcase>
  ),
};

export const MultipleExpanded: Story = {
  name: "Несколько раскрытых",
  render: () => (
    <Showcase title="Несколько раскрытых">
      <GroupExample allowsMultipleExpanded />
    </Showcase>
  ),
};

export const Controlled: Story = {
  name: "Управляемая с внешней навигацией",
  render: () => (
    <Showcase title="Управляемая с внешней навигацией">
      <ControlledExample />
    </Showcase>
  ),
};
