import {Bold, Italic, Strikethrough, Underline} from "@gravity-ui/icons";
import {ToggleButton, ToggleButtonGroup} from "@peakui/react";

const items = [
  {Icon: Bold, id: "bold", label: "Bold"},
  {Icon: Italic, id: "italic", label: "Italic"},
  {Icon: Underline, id: "underline", label: "Underline"},
  {Icon: Strikethrough, id: "strikethrough", label: "Strikethrough"},
];

export function Sizes() {
  return (
    <div className="flex flex-col items-center gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <ToggleButtonGroup key={size} selectionMode="multiple" size={size}>
          {items.map(({Icon, id, label}, index) => (
            <ToggleButton key={id} isIconOnly aria-label={label} id={id}>
              {index > 0 && <ToggleButtonGroup.Separator />}
              <Icon />
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      ))}
    </div>
  );
}
