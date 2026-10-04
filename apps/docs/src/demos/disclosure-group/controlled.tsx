"use client";

import {Calendar, ChevronDown, ChevronUp, QrCode} from "@gravity-ui/icons";
import {
  Button,
  Disclosure,
  DisclosureGroup,
  Separator,
  useDisclosureGroupNavigation,
} from "@peakui/react";
import React from "react";

export function Controlled() {
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
          <h3 className="text-lg font-semibold">Search settings</h3>
          <div className="flex gap-2">
            <Button
              aria-label="Previous disclosure"
              isDisabled={isPrevDisabled}
              size="sm"
              variant="secondary"
              onPress={onPrevious}
            >
              <ChevronUp className="size-4" />
            </Button>
            <Button
              aria-label="Next disclosure"
              isDisabled={isNextDisabled}
              size="sm"
              variant="secondary"
              onPress={onNext}
            >
              <ChevronDown className="size-4" />
            </Button>
          </div>
        </div>
        <DisclosureGroup expandedKeys={expandedKeys} onExpandedChange={setExpandedKeys}>
          <Disclosure aria-label="Search settings" id="search">
            <Disclosure.Heading>
              <Button
                slot="trigger"
                variant={expandedKeys.has("search") ? "secondary" : "tertiary"}
                className={
                  expandedKeys.has("search")
                    ? "w-full border-none"
                    : "w-full border-none bg-transparent"
                }
              >
                <div className="flex w-full items-center justify-start gap-2">
                  <QrCode />
                  Search settings
                </div>
                <Disclosure.Indicator className="text-muted" />
              </Button>
            </Disclosure.Heading>
            <Disclosure.Content>
              <Disclosure.Body className="mx-2 p-4 text-sm text-muted">
                Case sensitivity, whole words and regular expressions apply to the next query.
              </Disclosure.Body>
            </Disclosure.Content>
          </Disclosure>
          <Separator className="my-2" />
          <Disclosure id="history">
            <Disclosure.Heading aria-label="Query history">
              <Button
                slot="trigger"
                variant={expandedKeys.has("history") ? "secondary" : "tertiary"}
                className={
                  expandedKeys.has("history")
                    ? "w-full border-none"
                    : "w-full border-none bg-transparent"
                }
              >
                <div className="flex w-full items-center justify-start gap-2">
                  <Calendar />
                  Query history
                </div>
                <Disclosure.Indicator className="text-muted" />
              </Button>
            </Disclosure.Heading>
            <Disclosure.Content>
              <Disclosure.Body className="mx-2 p-4 text-sm text-muted">
                Recent queries are stored locally and are visible only to you.
              </Disclosure.Body>
            </Disclosure.Content>
          </Disclosure>
        </DisclosureGroup>
      </div>
    </div>
  );
}
