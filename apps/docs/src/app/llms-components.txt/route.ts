import {getLLMText} from "@/lib/get-llm-text";
import {LLMS_TEXT_HEADERS, filterPagesByType} from "@/lib/llms-utils";
import {source} from "@/lib/source";

export const revalidate = false;

/** Full markdown of every component page, concatenated. */
export async function GET() {
  const pages = filterPagesByType(source.getPages(), "components");

  if (pages.length === 0) {
    return new Response("No component documentation found", {
      headers: LLMS_TEXT_HEADERS,
      status: 404,
    });
  }

  const scanned = await Promise.all(pages.map(getLLMText));

  return new Response(scanned.join("\n\n"), {headers: LLMS_TEXT_HEADERS});
}
