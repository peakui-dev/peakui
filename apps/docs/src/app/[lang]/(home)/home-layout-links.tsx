import type {LinkItemType} from "@/components/fumadocs/ui/link-item";
import type {Dictionary} from "@/lib/dictionaries";

import {Iconify} from "@/components/iconify";

export function getHomeLayoutLinks(dict: Dictionary): LinkItemType[] {
  const nav = dict.nav;

  return [
    {
      items: [
        {
          icon: <Iconify icon="book" />,
          text: nav.gettingStarted,
          url: "/docs/react/getting-started",
        },
        {
          icon: <Iconify icon="circles-4-diamond" />,
          text: nav.components,
          url: "/docs/react/components",
        },
      ],
      on: "menu",
      text: nav.documentation,
      type: "menu",
    },
    {
      active: "nested-url",
      on: "nav",
      text: nav.docs,
      url: "/docs/react/getting-started",
    },
    {
      active: "nested-url",
      on: "nav",
      text: nav.components,
      url: "/docs/react/components",
    },
  ];
}
