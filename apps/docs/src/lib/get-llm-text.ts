import type {Page} from "@/lib/source";

import matter from "gray-matter";
import {remark} from "remark";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";

import {siteConfig} from "@/config/site";
import {getComponentCount, getDemo, getExampleCount} from "@/demos";
import {COMPONENT_GROUPS} from "@/lib/component-groups";
import {readDemoSource, readDocsSource} from "@/lib/read-source";
import {absoluteUrl} from "@/lib/seo";
import {source} from "@/lib/source";

/*
 * One function turns a docs page into markdown. The per-page route, the `Accept: text/markdown`
 * response and the concatenated llms files all call it, so they cannot disagree.
 *
 * MDX components are removed by walking the syntax tree rather than by matching tag names with
 * regular expressions: an unknown component is unwrapped to its children, so no JSX tag can
 * survive whatever gets added to the MDX component map later.
 */

const DEFAULT_CATEGORY = "docs";

/** The subset of the mdast / mdx-jsx node shapes this module reads or writes. */
interface MdxAttribute {
  name?: string;
  type: string;
  value?: string | {value: string} | null;
}

interface MdNode {
  attributes?: MdxAttribute[];
  children?: MdNode[];
  lang?: string | null;
  name?: string | null;
  type: string;
  url?: string;
  value?: string;
}

const processor = remark().use(remarkMdx).use(remarkGfm).data("settings", {bullet: "-"});

function isJsxElement(node: MdNode): boolean {
  return node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement";
}

function isMdxScript(node: MdNode): boolean {
  return (
    node.type === "mdxjsEsm" ||
    node.type === "mdxFlowExpression" ||
    node.type === "mdxTextExpression"
  );
}

function getAttribute(node: MdNode, name: string): string | undefined {
  const attribute = node.attributes?.find((item) => item.name === name);

  if (!attribute || attribute.value === null || attribute.value === undefined) return undefined;

  if (typeof attribute.value === "string") return attribute.value;

  // An expression attribute such as code={`...`}: unwrap a plain template or string literal.
  const expression = attribute.value.value.trim();
  const literal = expression.match(/^(?:`([\s\S]*)`|"([\s\S]*)"|'([\s\S]*)')$/);

  return literal ? (literal[1] ?? literal[2] ?? literal[3]) : expression;
}

function codeNode(value: string, lang: string): MdNode {
  return {lang, type: "code", value: value.trim()};
}

async function demoSourceNode(node: MdNode, pagePath: string): Promise<MdNode> {
  const name = getAttribute(node, "name");
  const demo = name ? getDemo(name) : undefined;

  // A missing demo fails the page instead of leaking the raw tag into the output.
  if (!name || !demo) {
    throw new Error(`${pagePath}: <ComponentPreview name="${name ?? ""}"> has no registered demo`);
  }

  const code = await readDemoSource(demo.file);

  return codeNode(code, "tsx");
}

function componentsCategoryNode(node: MdNode, locale?: string): MdNode[] {
  const category = getAttribute(node, "category");
  const group = COMPONENT_GROUPS.find((item) => item.category === category);

  if (!group) return [];

  const items: MdNode[] = [];

  for (const path of group.components) {
    const slug = path.split("/").filter((part) => !part.startsWith("("));
    const page = source.getPage(["react", "components", ...slug], locale);

    if (!page) continue;

    const description = page.data.description ? `: ${page.data.description}` : "";

    items.push({
      children: [
        {
          children: [
            {
              children: [{type: "text", value: page.data.title}],
              type: "link",
              url: absoluteUrl(page.url),
            },
            {type: "text", value: description},
          ],
          type: "paragraph",
        },
      ],
      type: "listItem",
    });
  }

  return items.length > 0 ? [{children: items, type: "list"}] : [];
}

/** Resolves a destination against the page's own URL; absolute URLs and `mailto:` pass through. */
function resolveUrl(url: string, page: Page): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return url;

  // `//host/x` names another host, not a path on this site; it takes the page's own scheme.
  if (url.startsWith("/") && !url.startsWith("//")) return absoluteUrl(url);

  return new URL(url, absoluteUrl(page.url)).toString();
}

/** Returns the markdown nodes that replace `node`: itself, a substitute, its children or nothing. */
async function transformNode(node: MdNode, page: Page): Promise<MdNode[]> {
  if (isMdxScript(node)) return [];

  if (isJsxElement(node)) {
    if (node.name === "ComponentPreview") return [await demoSourceNode(node, page.path)];

    if (node.name === "CollapsibleCode") {
      return [codeNode(getAttribute(node, "code") ?? "", getAttribute(node, "lang") ?? "tsx")];
    }

    if (node.name === "ComponentsCategory") return componentsCategoryNode(node, page.locale);

    if (node.name === "br") return [{type: "break"}];

    // Inline counters render live numbers on the site; the markdown states the same numbers.
    if (node.name === "ComponentCount") return [{type: "text", value: String(getComponentCount())}];

    if (node.name === "ExampleCount") return [{type: "text", value: String(getExampleCount())}];

    // Any other component is presentational: keep what it wraps, drop the tag.
    return transformChildren(node.children ?? [], page);
  }

  // An `npm` block renders as package-manager tabs on the site; in markdown it is a shell command.
  if (node.type === "code" && node.lang === "npm") return [{...node, lang: "bash"}];

  // The `[!toc]` suffix hides a heading from the on-page table of contents; it is not content.
  if (node.type === "heading") return [stripTocMarker(await withChildren(node, page))];

  // A relative destination is useless outside the site: agents read it detached from the origin.
  // This covers inline links, images and reference definitions alike.
  if (
    (node.type === "link" || node.type === "image" || node.type === "definition") &&
    node.url !== undefined
  ) {
    return [{...(await withChildren(node, page)), url: resolveUrl(node.url, page)}];
  }

  if (node.children) return [await withChildren(node, page)];

  return [node];
}

async function withChildren(node: MdNode, page: Page): Promise<MdNode> {
  return {...node, children: await transformChildren(node.children ?? [], page)};
}

function stripTocMarker(heading: MdNode): MdNode {
  const children = (heading.children ?? []).map((child) =>
    child.type === "text" && child.value !== undefined
      ? {...child, value: child.value.replace(/\s*\[!toc\]/g, "")}
      : child,
  );

  return {...heading, children};
}

async function transformChildren(children: MdNode[], page: Page): Promise<MdNode[]> {
  const result: MdNode[] = [];

  for (const child of children) {
    result.push(...(await transformNode(child, page)));
  }

  return result;
}

async function getRawMDXContent(pagePath: string): Promise<string> {
  // `page.path` already carries the locale directory (`en/react/components/...`).
  return readDocsSource(pagePath);
}

function formatHeader(page: Page): string {
  const description = page.data.description ? `\n> ${page.data.description}\n` : "";

  return `# ${page.data.title}
${description}
**Category**: ${page.slugs[1] ?? DEFAULT_CATEGORY}
**URL**: ${absoluteUrl(page.url)}
**Source**: ${siteConfig.githubRawUrl}/${page.path}
`;
}

/** The page body as plain markdown: no frontmatter, no MDX, demos inlined as `tsx` code blocks. */
export async function getPageMarkdown(page: Page): Promise<string> {
  return mdxToMarkdown(await getRawMDXContent(page.path), page);
}

/** The conversion itself, on MDX text instead of a page on disk. */
export async function mdxToMarkdown(mdx: string, page: Page): Promise<string> {
  const {content} = matter(mdx);
  const tree = processor.parse(content) as MdNode;

  tree.children = await transformChildren(tree.children ?? [], page);

  // The tree holds only standard markdown nodes at this point, so stringifying cannot emit JSX.
  return processor.stringify(tree as Parameters<typeof processor.stringify>[0]).trim();
}

/** The page wrapped in `<page url="…">` with a header: title, category, URL, source link. */
export async function getLLMText(page: Page): Promise<string> {
  const body = await getPageMarkdown(page);

  return `<page url="${absoluteUrl(page.url)}">
${formatHeader(page)}
${body}
</page>`;
}
