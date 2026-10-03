import {siteConfig} from "@/config/site";
import {JSON_HEADERS, filterPagesByType, markdownUrl} from "@/lib/llms-utils";
import {absoluteUrl} from "@/lib/seo";
import {source} from "@/lib/source";
import {generateComponentLinks} from "@/utils/extract-links";
import {currentVersion} from "@/utils/version";

export const revalidate = false;

/**
 * The components index: one entry per component page, generated from frontmatter. It exists so
 * that a CLI or an MCP server never has to parse `llms.txt` to find a component.
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
      name: page.slugs[page.slugs.length - 1] ?? "",
      title: page.data.title,
      url: absoluteUrl(page.url),
    };
  });

  const body = {
    components: components.sort((a, b) => a.name.localeCompare(b.name)),
    library: {
      name: "@peakui/react",
      version: currentVersion,
    },
    site: siteConfig.siteUrl.origin,
  };

  return new Response(JSON.stringify(body, null, 2), {headers: JSON_HEADERS});
}
