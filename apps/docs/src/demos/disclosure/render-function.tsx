"use client";

import {QrCode} from "@gravity-ui/icons";
import {Button, Disclosure} from "@peakui/react";
import React from "react";

export function RenderFunction() {
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <div className="w-full max-w-md text-center">
      <Disclosure
        isExpanded={isExpanded}
        render={(props) => <div {...props} data-custom="foo" />}
        onExpandedChange={setIsExpanded}
      >
        <Disclosure.Heading>
          <Button slot="trigger" variant="secondary">
            <QrCode />
            Search settings
            <Disclosure.Indicator />
          </Button>
        </Disclosure.Heading>
        <Disclosure.Content render={(props) => <div data-custom="bar" {...props} />}>
          <Disclosure.Body className="rounded-2xl bg-surface p-4 text-center">
            <p className="text-sm text-muted">
              The root and the panel render through custom elements.
            </p>
          </Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
    </div>
  );
}
