import {Iconify} from "@/components/iconify";
import {StatusChip} from "@/components/status-chip";

const STATUS_ICONS = ["new", "new-dot", "preview", "updated"] as const;

type StatusIcon = (typeof STATUS_ICONS)[number];

function isStatusIcon(value: string): value is StatusIcon {
  return (STATUS_ICONS as readonly string[]).includes(value);
}

export function createMetaIcon(iconName: string | undefined) {
  if (!iconName) return undefined;

  // A status name in the `icon` frontmatter field renders a badge after the title instead of an
  // icon. The key is stable because fumadocs renders the icon as an array child.
  if (isStatusIcon(iconName)) {
    return <StatusChip key={`status-${iconName}`} className="order-last" status={iconName} />;
  }

  return <Iconify key={`icon-${iconName}`} icon={iconName} />;
}
