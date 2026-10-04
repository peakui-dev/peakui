import {Chip} from "@peakui/react";

import {Iconify} from "@/components/iconify";
import {isComponentStatus, statusChipProps} from "@/lib/component-status";

export function createMetaIcon(iconName: string | undefined) {
  if (!iconName) return undefined;

  // A status name in the `icon` frontmatter field renders a badge after the title instead of an
  // icon. The key is stable because fumadocs renders the icon as an array child.
  if (isComponentStatus(iconName)) {
    const props = statusChipProps(iconName);

    return props ? <Chip key={`status-${iconName}`} className="order-last" {...props} /> : null;
  }

  return <Iconify key={`icon-${iconName}`} icon={iconName} />;
}
