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
});
