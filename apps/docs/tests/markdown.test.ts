import {readFile} from "node:fs/promises";

import {remark} from "remark";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import {describe, expect, it} from "vitest";

import {getComponentCount, getExampleCount} from "@/demos";
import {getLLMText, getPageMarkdown, mdxToMarkdown} from "@/lib/get-llm-text";
import {source} from "@/lib/source";

const pages = source.getPages();
const parser = remark().use(remarkMdx).use(remarkGfm);

interface Node {
  children?: Node[];
  name?: string | null;
  type: string;
}

/** Every JSX element or MDX expression left in the markdown, ignoring code fences. */
function findJsx(markdown: string): string[] {
  const found: string[] = [];

  function walk(node: Node) {
    if (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") {
      found.push(node.name ?? "<>");
    }

    if (node.type.startsWith("mdx") && node.type.endsWith("Expression")) found.push(node.type);

    if (node.type === "mdxjsEsm") found.push(node.type);

    node.children?.forEach(walk);
  }

  walk(parser.parse(markdown) as Node);

  return found;
}

describe("page markdown", () => {
  it("finds the pages", () => {
    expect(pages.length).toBeGreaterThan(10);
  });

  it.each(pages.map((page) => [page.url, page] as const))("%s converts", async (_url, page) => {
    const markdown = await getPageMarkdown(page);

    expect(markdown.length).toBeGreaterThan(0);
    expect(await getLLMText(page)).toContain(`<page url="`);
  });

  it.each(pages.map((page) => [page.url, page] as const))(
    "%s keeps no JSX outside code fences",
    async (_url, page) => {
      expect(findJsx(await getPageMarkdown(page))).toEqual([]);
    },
  );

  it("inlines a demo source for every ComponentPreview", async () => {
    let previews = 0;

    for (const page of pages) {
      const raw = await readFile(`content/docs/${page.path}`, "utf-8");
      const count = (raw.match(/<ComponentPreview/g) ?? []).length;
      const markdown = await getPageMarkdown(page);

      previews += count;
      expect(markdown).not.toContain("ComponentPreview");
      expect((markdown.match(/^```tsx/gm) ?? []).length).toBeGreaterThanOrEqual(count);
    }

    expect(previews).toBeGreaterThan(10);
  });

  it("throws when a ComponentPreview names a missing demo", async () => {
    await expect(
      mdxToMarkdown('<ComponentPreview name="no-such-demo" />', pages[0]!),
    ).rejects.toThrow(/no-such-demo/);
  });

  it("states the real component and example counts in the introduction", async () => {
    const intro = pages.find((page) => page.slugs.join("/") === "react/getting-started");

    expect(intro).toBeDefined();

    const markdown = await getPageMarkdown(intro!);

    expect(markdown).toContain(
      `The library ships ${getComponentCount()} components with ${getExampleCount()} examples`,
    );
  });

  it("strips the [!toc] marker from headings", async () => {
    for (const page of pages) {
      const markdown = await getPageMarkdown(page);

      expect(markdown, page.url).not.toMatch(/\\?\[!toc\\?\]/);
    }
  });

  it("makes in-body links absolute", async () => {
    for (const page of pages) {
      const markdown = await getPageMarkdown(page);

      expect(markdown, page.url).not.toMatch(/\]\(\/[^)]*\)/);
    }

    const markdown = await mdxToMarkdown(
      "See [the button](/docs/react/components/button).",
      pages[0]!,
    );

    expect(markdown).toContain("](http");
  });
});
