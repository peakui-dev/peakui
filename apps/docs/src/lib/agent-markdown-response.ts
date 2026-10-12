import {siteConfig} from "@/config/site";
import {getHomepageMarkdown, resolveDocsPath} from "@/lib/agent-markdown";
import {getLLMText} from "@/lib/get-llm-text";
import {MARKDOWN_HEADERS} from "@/lib/llms-utils";
import {source} from "@/lib/source";

/*
 * Builds the markdown Response for an `Accept: text/markdown` request. Called by the proxy,
 * which is the only entry point: an external client never reaches this code without the
 * negotiation check. Answering from the proxy (instead of rewriting to an internal route)
 * keeps the explicit headers intact on every host — vinext replaces Cache-Control on
 * rewritten route responses.
 */

function markdownResponse(markdown: string, status = 200): Response {
  return new Response(markdown, {headers: MARKDOWN_HEADERS, status});
}

export async function getMarkdownResponse(pathname: string): Promise<Response> {
  if (pathname === "/" || pathname === "/en") {
    return markdownResponse(getHomepageMarkdown(siteConfig.siteUrl.origin));
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
