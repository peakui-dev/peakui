import type {NextRequest} from "next/server";

import {getHomepageMarkdown, resolveDocsPath} from "@/lib/agent-markdown";
import {getLLMText} from "@/lib/get-llm-text";
import {MARKDOWN_HEADERS} from "@/lib/llms-utils";
import {source} from "@/lib/source";

export const dynamic = "force-dynamic";

/** Header set by `proxy.ts` when it rewrites an `Accept: text/markdown` request here. */
const MARKDOWN_PATH_HEADER = "x-peakui-markdown-path";

function markdownResponse(markdown: string, status = 200): Response {
  return new Response(markdown, {headers: MARKDOWN_HEADERS, status});
}

async function getMarkdownForPath(request: NextRequest): Promise<Response> {
  const pathname =
    request.headers.get(MARKDOWN_PATH_HEADER) ?? request.nextUrl.searchParams.get("path") ?? "/";

  if (pathname === "/" || pathname === "/en") {
    return markdownResponse(getHomepageMarkdown(request.nextUrl.origin));
  }

  const resolved = resolveDocsPath(pathname);
  const page = resolved ? source.getPage(resolved.slug, resolved.lang) : undefined;

  if (!page) {
    return markdownResponse(
      `# Not Found\n\nNo markdown representation is available for ${pathname}.\n`,
      404,
    );
  }

  return markdownResponse(await getLLMText(page));
}

export async function GET(request: NextRequest) {
  return getMarkdownForPath(request);
}

export async function HEAD(request: NextRequest) {
  const response = await getMarkdownForPath(request);

  return new Response(null, {headers: response.headers, status: response.status});
}
