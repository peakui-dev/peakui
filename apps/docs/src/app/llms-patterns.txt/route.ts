import {getLLMText} from "@/lib/get-llm-text";
import {LLMS_TEXT_HEADERS, filterPagesByType} from "@/lib/llms-utils";
import {source} from "@/lib/source";

export const revalidate = false;

/** Full markdown of every guide page, concatenated. */
export async function GET() {
  const pages = filterPagesByType(source.getPages(), "patterns");

  if (pages.length === 0) {
    return new Response("No guide documentation found", {
      headers: LLMS_TEXT_HEADERS,
      status: 404,
    });
  }

  const scanned = await Promise.all(pages.map(getLLMText));

  return new Response(scanned.join("\n\n"), {headers: LLMS_TEXT_HEADERS});
}
