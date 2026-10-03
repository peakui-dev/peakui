import type {Page} from "@/lib/source";

import {siteConfig} from "@/config/site";
import {JSON_HEADERS, assertUniqueNames, filterPagesByType, markdownUrl} from "@/lib/llms-utils";
import {absoluteUrl} from "@/lib/seo";
import {source} from "@/lib/source";
import {generateComponentLinks} from "@/utils/extract-links";
import {currentVersion} from "@/utils/version";

export const revalidate = false;

/** Bumped only by a breaking change; additive changes keep it. See docs/ecosystem/docs-site-contract.md. */
const SCHEMA_VERSION = 1;

function pageName(page: Page): string {
  return page.slugs[page.slugs.length - 1] ?? "";
}

/**
 * The docs index: one entry per component page and one per guide, generated from frontmatter. It
 * exists so that a CLI or an MCP server never has to parse `llms.txt` to find a page.
 */
export function GET() {
  const components = filterPagesByType(source.getPages(), "components").map((page) => {
    const links = generateComponentLinks(page.data.links);

    return {
      description: page.data.description ?? "",
      links: {
        reactAria: links?.rac ?? null,
        source: links?.source ?? null,
        styles: links?.styles ?? null,
      },
      markdownUrl: markdownUrl(page),
      name: pageName(page),
      title: page.data.title,
      url: absoluteUrl(page.url),
    };
  });

  const guides = filterPagesByType(source.getPages(), "patterns").map((page) => ({
    description: page.data.description ?? "",
    markdownUrl: markdownUrl(page),
    name: pageName(page),
    title: page.data.title,
    url: absoluteUrl(page.url),
  }));

  assertUniqueNames([...components, ...guides]);

  const body = {
    components: components.sort((a, b) => a.name.localeCompare(b.name)),
    guides: guides.sort((a, b) => a.name.localeCompare(b.name)),
    library: {
      name: "@peakui/react",
      version: currentVersion,
    },
    schemaVersion: SCHEMA_VERSION,
    site: siteConfig.siteUrl.origin,
  };

  return new Response(JSON.stringify(body, null, 2), {headers: JSON_HEADERS});
}
