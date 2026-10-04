"use client";

import {QrCode} from "@gravity-ui/icons";
import {Button, Disclosure} from "@peakui/react";
import React from "react";

export function Basic() {
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <div className="w-full max-w-md text-center">
      <Disclosure isExpanded={isExpanded} onExpandedChange={setIsExpanded}>
        <Disclosure.Heading>
          <Button slot="trigger" variant="secondary">
            <QrCode />
            Search settings
            <Disclosure.Indicator />
          </Button>
        </Disclosure.Heading>
        <Disclosure.Content>
          <Disclosure.Body className="flex flex-col items-center gap-2 rounded-3xl bg-surface p-4 text-center">
            <p className="text-sm text-muted">
              Case sensitivity, whole words and regular expressions apply to the next query.
            </p>
            <Button className="mt-2" variant="primary">
              Apply
            </Button>
          </Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
    </div>
  );
}
