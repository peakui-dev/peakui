import {Label, Meter} from "@peakui/react";

const COLORS = [
  {color: "default", label: "Default"},
  {color: "accent", label: "Accent"},
  {color: "success", label: "Success"},
  {color: "warning", label: "Warning"},
  {color: "danger", label: "Danger"},
] as const;

export function Colors() {
  return (
    <div className="flex w-64 flex-col gap-6">
      {COLORS.map(({color, label}) => (
        <Meter key={color} color={color} value={50}>
          <Label>{label}</Label>
          <Meter.Output />
          <Meter.Track>
            <Meter.Fill />
          </Meter.Track>
        </Meter>
      ))}
    </div>
  );
}
