import type {NextRequest} from "next/server";

import {NextResponse} from "next/server";

import {acceptsMarkdown} from "@/lib/agent-markdown";
import {i18n} from "@/lib/i18n";

/** Header carrying the original path to the markdown route. Kept in sync with that route. */
const MARKDOWN_PATH_HEADER = "x-peakui-markdown-path";

// Paths that never get a markdown representation or a locale prefix.
const EXCLUDED_PREFIXES = ["/agent-markdown", "/_next", "/api", "/llms"];

const PUBLIC_FILE_PATTERN = /\.[a-z0-9]+$/i;
const PERMANENT_LOCALIZED_PREFIXES = ["/docs"];

const SUPPORTED_LOCALES = new Set<string>(i18n.languages);
const DEFAULT_LOCALE = i18n.defaultLanguage;

function getLocaleFromPath(pathname: string): string | undefined {
  const firstSegment = pathname.split("/").filter(Boolean)[0];

  return firstSegment && SUPPORTED_LOCALES.has(firstSegment) ? firstSegment : undefined;
}

function isExcluded(pathname: string): boolean {
  if (EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;

  // Files with extensions (`.md`, `.mdx`, static assets) are handled by rewrites or served as is.
  return PUBLIC_FILE_PATTERN.test(pathname);
}

function shouldPermanentlyRedirect(pathname: string): boolean {
  return PERMANENT_LOCALIZED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function proxy(request: NextRequest) {
  const {pathname} = request.nextUrl;

  if (isExcluded(pathname)) return NextResponse.next();

  // The markdown handler runs first, so an agent is served regardless of the locale prefix.
  if ((request.method === "GET" || request.method === "HEAD") && acceptsMarkdown(request)) {
    const url = request.nextUrl.clone();

    url.pathname = "/agent-markdown";
    url.search = "";
    url.searchParams.set("path", pathname);

    const requestHeaders = new Headers(request.headers);

    requestHeaders.set(MARKDOWN_PATH_HEADER, pathname);

    return NextResponse.rewrite(url, {request: {headers: requestHeaders}});
  }

  // Routes under `app/[lang]` need a locale prefix. The home page is rewritten so the visible URL
  // stays clean; every other path is redirected to its prefixed form.
  if (!getLocaleFromPath(pathname)) {
    const url = request.nextUrl.clone();

    if (pathname === "/") {
      url.pathname = `/${DEFAULT_LOCALE}`;

      return NextResponse.rewrite(url);
    }

    url.pathname = `/${DEFAULT_LOCALE}${pathname}`;

    return NextResponse.redirect(url, shouldPermanentlyRedirect(pathname) ? 308 : 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
