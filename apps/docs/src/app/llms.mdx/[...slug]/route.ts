import type {NextRequest} from "next/server";

import {notFound} from "next/navigation";

import {getLLMText} from "@/lib/get-llm-text";
import {i18n} from "@/lib/i18n";
import {MARKDOWN_HEADERS} from "@/lib/llms-utils";
import {source} from "@/lib/source";

export const dynamic = "force-static";
export const revalidate = false;

const SUPPORTED_LANGS = new Set<string>(i18n.languages);

function extractLangFromSlug(slug: string[]): {slug: string[]; lang?: string} {
  const first = slug[0];

  if (first !== undefined && SUPPORTED_LANGS.has(first)) {
    return {lang: first, slug: slug.slice(1)};
  }

  return {slug};
}

/**
 * Markdown of one docs page. Reached through the rewrites in next.config.ts:
 * `/docs/<slug>.md`, `/docs/<slug>.mdx` and their `/en/...` forms.
 */
export async function GET(_req: NextRequest, {params}: {params: Promise<{slug: string[]}>}) {
  const {lang, slug} = extractLangFromSlug((await params).slug);
  const page = source.getPage(slug, lang);

  if (!page) notFound();

  return new Response(await getLLMText(page), {headers: MARKDOWN_HEADERS});
}

export function generateStaticParams() {
  return source
    .getPages()
    .map((page) => ({slug: [page.locale ?? i18n.defaultLanguage, ...page.slugs]}));
}
