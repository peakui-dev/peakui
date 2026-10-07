import {Display, Moon, Sun} from "@gravity-ui/icons";
import {SegmentedControl} from "@peakui/react";

export function IconOnly() {
  return (
    <SegmentedControl aria-label="Theme" defaultSelectedKey="system">
      <SegmentedControl.Item isIconOnly aria-label="Light" id="light">
        <Sun />
      </SegmentedControl.Item>
      <SegmentedControl.Item isIconOnly aria-label="Dark" id="dark">
        <Moon />
      </SegmentedControl.Item>
      <SegmentedControl.Item isIconOnly aria-label="System" id="system">
        <Display />
      </SegmentedControl.Item>
    </SegmentedControl>
  );
}
