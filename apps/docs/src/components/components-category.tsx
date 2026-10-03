import type {ComponentInfo} from "./component-item";
import type {StatusChipStatus} from "./status-chip";

import {getDemo} from "@/demos";
import {COMPONENT_GROUPS} from "@/lib/component-groups";
import {source} from "@/lib/source";

import {ComponentItem} from "./component-item";

const STATUS_ICONS: readonly string[] = ["preview", "new", "updated", "new-dot"];

interface ComponentWithStatus {
  component: ComponentInfo;
  status?: StatusChipStatus;
}

interface ComponentsCategoryProps {
  category: string;
  locale?: string;
}

function isRouteGroup(part: string): boolean {
  return part.startsWith("(") && part.endsWith(")");
}

function getComponentWithStatus(path: string, locale?: string): ComponentWithStatus | null {
  const slug = path.split("/").filter((part) => !isRouteGroup(part));
  const page = source.getPage(["react", "components", ...slug], locale);

  if (!page) return null;

  const icon = page.data.icon;

  return {
    component: {
      description: page.data.description ?? "",
      href: page.url,
      name: slug[slug.length - 1] ?? path,
      title: page.data.title,
    },
    status: icon && STATUS_ICONS.includes(icon) ? (icon as StatusChipStatus) : undefined,
  };
}

/** The card preview is the component's `<name>-basic` demo, rendered live. */
async function ComponentCardPreview({name}: {name: string}) {
  const demo = getDemo(`${name}-basic`);

  if (!demo) return null;

  const Demo = await demo.loader();

  return <Demo />;
}

export function ComponentsCategory({category, locale}: ComponentsCategoryProps) {
  const group = COMPONENT_GROUPS.find((item) => item.category === category);

  if (!group) return null;

  const components = group.components
    .map((path) => getComponentWithStatus(path, locale))
    .filter((item): item is ComponentWithStatus => item !== null);

  if (components.length === 0) return null;

  return (
    <div className="not-prose grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {components.map(({component, status}) => (
        <ComponentItem
          key={component.name}
          component={component}
          preview={<ComponentCardPreview name={component.name} />}
          status={status}
        />
      ))}
    </div>
  );
}
