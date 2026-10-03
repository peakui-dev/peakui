import type {Page} from "@/lib/source";

import {readFile} from "node:fs/promises";
import {join} from "node:path";

import matter from "gray-matter";
import {remark} from "remark";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";

import {siteConfig} from "@/config/site";
import {getDemo} from "@/demos";
import {COMPONENT_GROUPS} from "@/lib/component-groups";
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

const CONTENT_DIR = "content/docs";
const DEMOS_DIR = "src/demos";
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

  const code = await readFile(join(process.cwd(), DEMOS_DIR, demo.file), "utf-8");

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

    // Any other component is presentational: keep what it wraps, drop the tag.
    return transformChildren(node.children ?? [], page);
  }

  // An `npm` block renders as package-manager tabs on the site; in markdown it is a shell command.
  if (node.type === "code" && node.lang === "npm") return [{...node, lang: "bash"}];

  if (node.children) {
    return [{...node, children: await transformChildren(node.children, page)}];
  }

  return [node];
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
  return readFile(join(process.cwd(), CONTENT_DIR, pagePath), "utf-8");
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
  const {content} = matter(await getRawMDXContent(page.path));
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
