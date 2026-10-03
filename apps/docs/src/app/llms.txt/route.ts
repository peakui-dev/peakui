import {LLMS_TEXT_HEADERS, generateIndexHeader, isComponentPage} from "@/lib/llms-utils";
import {absoluteUrl} from "@/lib/seo";
import {source} from "@/lib/source";

export const revalidate = false;

const SECTION_TITLES: Record<string, string> = {
  components: "Components",
  "getting-started": "Getting Started",
};

/** Index only: a hand-written header, then one line per page from its frontmatter. */
export function GET() {
  const lines = generateIndexHeader();
  const sections = new Map<string, string[]>();

  for (const page of source.getPages()) {
    const section = page.slugs[1] ?? "general";
    const list = sections.get(section) ?? [];
    const description = page.data.description ? `: ${page.data.description}` : "";

    // The gallery page lists the components; it goes first in its section.
    const line = `- [${page.data.title}](${absoluteUrl(page.url)})${description}`;

    if (section === "components" && !isComponentPage(page)) list.unshift(line);
    else list.push(line);

    sections.set(section, list);
  }

  const order = ["getting-started", "components"];
  const keys = [...order, ...[...sections.keys()].filter((key) => !order.includes(key)).sort()];

  for (const key of keys) {
    const list = sections.get(key);

    if (!list || list.length === 0) continue;

    lines.push(`### ${SECTION_TITLES[key] ?? key}`, "", list.join("\n"), "");
  }

  return new Response(lines.join("\n"), {headers: LLMS_TEXT_HEADERS});
}
