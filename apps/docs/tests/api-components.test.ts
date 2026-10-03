import {NextRequest} from "next/server";
import {describe, expect, it} from "vitest";

import {GET as getIndex} from "@/app/api/components/route";
import {GET as getPatterns} from "@/app/llms-patterns.txt/route";
import {GET as getMarkdown} from "@/app/llms.mdx/[...slug]/route";
import {assertUniqueNames} from "@/lib/llms-utils";
import {source} from "@/lib/source";

interface Entry {
  description: string;
  markdownUrl: string;
  name: string;
  title: string;
  url: string;
}

interface Index {
  components: (Entry & {links: Record<string, string | null>})[];
  guides: Entry[];
  library: {name: string; version: string};
  schemaVersion: number;
  site: string;
}

async function loadIndex(): Promise<Index> {
  return (await getIndex().json()) as Index;
}

describe("/api/components", () => {
  it("declares its schema version and keeps the existing fields", async () => {
    const index = await loadIndex();

    expect(index.schemaVersion).toBe(1);
    expect(index.library.name).toBe("@peakui/react");
    expect(typeof index.library.version).toBe("string");
    expect(index.site).toMatch(/^https?:\/\//);
    expect(index.components.length).toBeGreaterThan(0);

    for (const component of index.components) {
      expect(Object.keys(component).sort()).toEqual([
        "description",
        "links",
        "markdownUrl",
        "name",
        "title",
        "url",
      ]);
      expect(Object.keys(component.links).sort()).toEqual(["reactAria", "source", "styles"]);
    }
  });

  it("lists guides with the same fields as components, minus links", async () => {
    const {guides} = await loadIndex();

    expect(guides.length).toBeGreaterThan(0);

    for (const guide of guides) {
      expect(Object.keys(guide).sort()).toEqual([
        "description",
        "markdownUrl",
        "name",
        "title",
        "url",
      ]);
      expect(guide.url).toMatch(/^https?:\/\//);
      expect(guide.markdownUrl).toBe(`${guide.url}.md`);
      expect(guide.name.length).toBeGreaterThan(0);
      expect(guide.title.length).toBeGreaterThan(0);
    }
  });

  it("names every entry uniquely within its list", async () => {
    const {components, guides} = await loadIndex();

    for (const list of [components, guides]) {
      const names = list.map((entry) => entry.name);

      expect(new Set(names).size).toBe(names.length);
    }
  });

  it("names every entry uniquely across components and guides together", async () => {
    const {components, guides} = await loadIndex();
    const names = [...components, ...guides].map((entry) => entry.name);

    expect(new Set(names).size).toBe(names.length);
  });

  it("refuses a name that two pages share", () => {
    expect(() =>
      assertUniqueNames([
        {name: "button", url: "/docs/react/components/button"},
        {name: "button", url: "/docs/react/guides/button"},
      ]),
    ).toThrow(/button/);
    expect(() =>
      assertUniqueNames([
        {name: "a", url: "/a"},
        {name: "b", url: "/b"},
      ]),
    ).not.toThrow();
  });

  it("covers every docs page exactly once between components and guides", async () => {
    const {components, guides} = await loadIndex();
    const listed = [...components, ...guides].map((entry) => new URL(entry.url).pathname);
    const pages = source.getPages().map((page) => page.url);

    expect([...listed].sort()).toEqual([...pages].sort());
    expect(new Set(listed).size).toBe(listed.length);
  });

  it("gives every markdownUrl to a page the markdown route serves", async () => {
    const {components, guides} = await loadIndex();

    for (const entry of [...components, ...guides]) {
      const {pathname} = new URL(entry.markdownUrl);

      expect(pathname, entry.markdownUrl).toMatch(/^(\/en)?\/docs\/.+\.md$/);

      // next.config.ts rewrites `/[en/]docs/<slug>.md` to `/llms.mdx/[en/]<slug>`.
      const slug = pathname
        .replace(/^(\/en)?\/docs\//, "$1/")
        .replace(/^\//, "")
        .replace(/\.md$/, "");
      const response = await getMarkdown(new NextRequest(entry.markdownUrl), {
        params: Promise.resolve({slug: slug.split("/")}),
      });

      expect(response.status, entry.markdownUrl).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/markdown");
      expect(await response.text(), entry.markdownUrl).toContain(`<page url="${entry.url}">`);
    }
  });

  it("matches the set /llms-patterns.txt concatenates", async () => {
    const {guides} = await loadIndex();
    const text = await (await getPatterns()).text();
    const urls = [...text.matchAll(/<page url="([^"]+)">/g)].map((match) => match[1]);

    expect(urls.sort()).toEqual(guides.map((guide) => guide.url).sort());
  });
});
