import {NextRequest} from "next/server";
import {describe, expect, it} from "vitest";

import {getMarkdownResponse} from "@/lib/agent-markdown-response";
import {MARKDOWN_HEADERS} from "@/lib/llms-utils";
import {proxy} from "@/proxy";

const PAGE = "/en/docs/react/components/button";

describe("markdown negotiation", () => {
  it("serves the page markdown for the negotiated path", async () => {
    const response = await getMarkdownResponse(PAGE);

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("# Button");
  });

  it("serves the homepage markdown for the root path", async () => {
    const response = await getMarkdownResponse("/");

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("# PeakUI");
  });

  it("answers unknown paths with the markdown 404 body and headers", async () => {
    const response = await getMarkdownResponse("/nope");

    expect(response.status).toBe(404);
    expect(await response.text()).toContain("# Not Found");
    expect(response.headers.get("cache-control")).toBe(MARKDOWN_HEADERS["Cache-Control"]);
  });

  it("answers an Accept: text/markdown request straight from the proxy", async () => {
    const response = await proxy(
      new NextRequest(`http://localhost${PAGE}`, {headers: {accept: "text/markdown"}}),
    );

    expect(response).not.toBeNull();
    expect(response?.headers.get("content-type")).toContain("text/markdown");
    expect(response?.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("keeps machine routes and APIs out of the negotiation", async () => {
    for (const path of ["/api/components", "/llms.txt", "/_next/static/app.js"]) {
      const response = await proxy(
        new NextRequest(`http://localhost${path}`, {headers: {accept: "text/markdown"}}),
      );

      expect(response?.headers.get("content-type") ?? "").not.toContain("text/markdown");
      expect(response?.headers.get("x-middleware-rewrite")).toBeNull();
    }
  });

  it("drops any query string from the response target", async () => {
    const response = await proxy(
      new NextRequest(`http://localhost${PAGE}?impostor=1`, {
        headers: {accept: "text/markdown"},
      }),
    );

    expect(response?.headers.get("content-type")).toContain("text/markdown");
    expect(response?.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("builds the homepage markdown from the configured site URL, not the request origin", async () => {
    const response = await getMarkdownResponse("/");
    const text = await response.text();

    expect(text).not.toContain("internal-host");
    expect(text).toContain("](http://localhost:3000/docs/react/getting-started)");
  });
});
