import type {ReactNode} from "react";

import {Chip} from "@peakui/react";

import {baseOptions} from "@/app/[lang]/layout.config";
import {DocsLayout} from "@/components/fumadocs/layouts/notebook";
import {ThemeToggle} from "@/components/fumadocs/ui/theme-toggle";
import {GitHubLinkSmall} from "@/components/github-link";
import {PeakUILogo} from "@/components/peakui-logo";
import {source} from "@/lib/source";
import {currentVersion} from "@/utils/version";

export default async function Layout({
  children,
  params,
}: {
  params: Promise<{lang: string}>;
  children: ReactNode;
}) {
  const {lang} = await params;

  return (
    <DocsLayout
      tabMode="navbar"
      tree={source.getPageTree(lang)}
      sidebar={{
        banner: () => (
          <div className="flex flex-col items-start justify-center gap-4 px-4 pt-4 sm:hidden">
            <div className="flex w-full items-center justify-between gap-4 ps-1">
              <PeakUILogo />
              <ThemeToggle mode="light-dark-system" />
            </div>
            <hr className="w-full border-separator" />
          </div>
        ),
        collapsible: false,
        defaultOpenLevel: 0,
        headerTabsProps: {
          filterByPathname: true,
        },
        tabs: {
          transform: (tab) => {
            return {
              ...tab,
              title: (
                <div
                  aria-label={typeof tab.title === "string" ? tab.title : ""}
                  className="flex items-center gap-2"
                >
                  {tab.icon}
                  <span>{tab.title}</span>
                </div>
              ),
            };
          },
        },
      }}
      themeSwitch={{
        mode: "light-dark-system",
      }}
      {...baseOptions}
      nav={{
        ...baseOptions.nav,
        children: (
          <div className="me-2 flex items-center gap-3 md:me-0" id="nd-nav-actions">
            <GitHubLinkSmall />
          </div>
        ),
        mode: "top",
        title: <PeakUILogo />,
        titleSuffix: <Chip className="mt-1 hidden lg:inline-flex">v{currentVersion}</Chip>,
        titleSuffixGap: "gap-4",
      }}
    >
      {children}
    </DocsLayout>
  );
}
