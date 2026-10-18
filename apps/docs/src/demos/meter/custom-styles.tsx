import {Label, Meter} from "@peakui/react";

export function CustomStyles() {
  return (
    <Meter className="w-64" value={45}>
      <Label className="font-medium text-foreground">Storage used</Label>
      <Meter.Output className="text-xs text-muted tabular-nums" />
      <Meter.Track className="rounded-full bg-default">
        <Meter.Fill className="rounded-full bg-accent" />
      </Meter.Track>
    </Meter>
  );
}
