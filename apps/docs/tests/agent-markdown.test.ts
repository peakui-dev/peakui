import {NextRequest} from "next/server";
import {describe, expect, it} from "vitest";

import {GET} from "@/app/agent-markdown/route";
import {proxy} from "@/proxy";

const PAGE = "/en/docs/react/components/button";

describe("/agent-markdown", () => {
  it("serves the page named by the proxy header", async () => {
    const response = await GET(
      new NextRequest("http://localhost/agent-markdown", {
        headers: {"x-peakui-markdown-path": PAGE},
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("# Button");
  });

  it("ignores a ?path= query string when the header is absent", async () => {
    const response = await GET(new NextRequest(`http://localhost/agent-markdown?path=${PAGE}`));

    expect(response.status).toBe(404);
  });

  it("is still reached by Accept negotiation through the proxy", () => {
    const response = proxy(
      new NextRequest(`http://localhost${PAGE}`, {headers: {accept: "text/markdown"}}),
    );

    expect(response.headers.get("x-middleware-rewrite")).toContain("/agent-markdown");
    expect(response.headers.get("x-middleware-rewrite")).not.toContain("path=");
  });

  it("answers 404 when an external client hits /agent-markdown directly, header or not", () => {
    for (const headers of [{"x-peakui-markdown-path": PAGE} as Record<string, string>, {}]) {
      const response = proxy(new NextRequest("http://localhost/agent-markdown", {headers}));

      expect(response.status).toBe(404);
      expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    }
  });

  it("does not let a client-supplied header redirect a negotiated request", () => {
    const response = proxy(
      new NextRequest(`http://localhost${PAGE}`, {
        headers: {accept: "text/markdown", "x-peakui-markdown-path": "/en/docs/react/other"},
      }),
    );
    const forwarded = response.headers.get("x-middleware-request-x-peakui-markdown-path");

    expect(forwarded).toBe(PAGE);
  });

  it("builds the homepage markdown from the configured site URL, not the request origin", async () => {
    const response = await GET(
      new NextRequest("http://internal-host:8080/agent-markdown", {
        headers: {"x-peakui-markdown-path": "/"},
      }),
    );
    const text = await response.text();

    expect(text).not.toContain("internal-host");
    expect(text).toContain("](http://localhost:3000/docs/react/getting-started)");
  });
});
