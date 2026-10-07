import type {ReactNode} from "react";

import {HomeLayout} from "fumadocs-ui/layouts/home";
import {notFound} from "next/navigation";

import {baseOptions} from "@/app/[lang]/layout.config";
import {SearchToggle} from "@/components/fumadocs/ui/search-toggle";
import {ThemeToggleSystem} from "@/components/fumadocs/ui/theme-toggle";
import {GitHubLinkSmall} from "@/components/github-link";
import {getDictionary, hasLocale} from "@/lib/dictionaries";

import {getHomeLayoutLinks} from "./home-layout-links";

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{lang: string}>;
}) {
  const {lang} = await params;

  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <HomeLayout
      {...baseOptions}
      links={[
        ...getHomeLayoutLinks(dict),
        {
          children: <GitHubLinkSmall />,
          on: "nav" as const,
          secondary: true,
          type: "custom" as const,
        },
        {
          children: <GitHubLinkSmall />,
          on: "menu" as const,
          secondary: true,
          type: "custom" as const,
        },
      ]}
      searchToggle={{
        components: {
          lg: <SearchToggle hideIfDisabled />,
          sm: <SearchToggle hideIfDisabled />,
        },
      }}
      /*
       * Without this slot HomeLayout renders the upstream fumadocs ThemeSwitch, and the home page
       * showed a different control from the docs pages. The slot takes a component, not an element,
       * and renders it with no props — hence the pre-bound ThemeToggleSystem. `themeSwitch.mode`
       * reached the upstream component only, so it goes away with it.
       */
      slots={{
        themeSwitch: ThemeToggleSystem,
      }}
    >
      {children}
    </HomeLayout>
  );
}
