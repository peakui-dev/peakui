"use client";

import {Fieldset, Input, Label, TextField} from "@peakui/react";

export function RenderProp() {
  return (
    <Fieldset className="w-full max-w-sm">
      {/* `render` swaps the element and keeps the part's class, data-slot and ref. */}
      <Fieldset.Legend render={(props) => <legend {...props} id="shipping-legend" />}>
        Shipping address
      </Fieldset.Legend>
      <Fieldset.Group render={(props) => <section {...props} aria-labelledby="shipping-legend" />}>
        <TextField fullWidth name="street">
          <Label>Street</Label>
          <Input placeholder="1 Main Street" />
        </TextField>
      </Fieldset.Group>
    </Fieldset>
  );
}
