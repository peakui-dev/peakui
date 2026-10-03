import type {Page} from "@/lib/source";

import {absoluteUrl} from "@/lib/seo";
import {currentVersion} from "@/utils/version";

export type ContentType = "components" | "patterns";

export const LLMS_TEXT_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
  "Content-Type": "text/plain; charset=utf-8",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

export const MARKDOWN_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
  "Content-Type": "text/markdown; charset=utf-8",
  Vary: "Accept",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

export const JSON_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
  "Content-Type": "application/json; charset=utf-8",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

/** A component page is a leaf under `/components/`; the gallery index is not one. */
export function isComponentPage(page: Page): boolean {
  return page.slugs[1] === "components" && page.slugs.length > 2;
}

/** A guide is every docs page that is not a component page, the components gallery included. */
export function isPatternPage(page: Page): boolean {
  return !isComponentPage(page);
}

export function filterPagesByType(pages: Page[], type: ContentType): Page[] {
  return pages.filter((page) =>
    type === "components" ? isComponentPage(page) : isPatternPage(page),
  );
}

/** The URL of a page's markdown version. */
export function markdownUrl(page: Page): string {
  return `${absoluteUrl(page.url)}.md`;
}

/** The hand-written head of `/llms.txt`; everything after it is generated from frontmatter. */
export function generateIndexHeader(): string[] {
  return [
    "# PeakUI Documentation",
    "",
    "> Accessible React components built on React Aria Components and Tailwind CSS v4, styled with BEM classes and CSS custom properties.",
    "",
    `PeakUI (\`@peakui/react\` ${currentVersion}) is an open-source React component library. Behavior and accessibility come from [React Aria Components](https://react-aria.adobe.com/); styles live in \`@peakui/styles\` as plain CSS on top of [Tailwind CSS v4](https://tailwindcss.com/).`,
    "",
    "**What to know before writing code:**",
    "",
    '- Import everything from the package root: `import {Button} from "@peakui/react"`. There are no deep imports.',
    '- Import Tailwind before the PeakUI stylesheet: `@import "tailwindcss";` then `@import "@peakui/styles/css";`.',
    "- Components are compound: `TextField` is the root; `Label`, `Input`, `Description` and `FieldError` are its children.",
    "- Props follow React Aria: `isDisabled`, `isPending`, `onPress`. There is no `classNames` or `as` prop; `Button` has no `color` prop, use `variant`.",
    "- React 19 or later. There is no provider component; the theme is CSS.",
    "",
    "## Machine-readable resources",
    "",
    `- [All component pages as one file](${absoluteUrl("/llms-components.txt")})`,
    `- [All guides as one file](${absoluteUrl("/llms-patterns.txt")})`,
    `- [Components index (JSON)](${absoluteUrl("/api/components")})`,
    "- Any documentation page as markdown: append `.md` to its URL, or request it with `Accept: text/markdown`.",
    "",
    "## Documentation Index",
    "",
  ];
}
