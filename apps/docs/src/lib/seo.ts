import {siteConfig} from "@/config/site";
import {i18n} from "@/lib/i18n";

export const DEFAULT_LOCALE = i18n.defaultLanguage;
export const LOCALES: readonly string[] = i18n.languages;

const LOCALE_PREFIX_PATTERN = new RegExp(`^/(${LOCALES.join("|")})(?=/|$)`);

export function normalizeLocale(locale: string | undefined): string {
  return locale && LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
}

/** Turns `/en/docs/react/button` into the locale-agnostic `/docs/react/button`. */
export function stripLocale(path: string): string {
  return path.replace(LOCALE_PREFIX_PATTERN, "") || "/";
}

/**
 * Resolves the URL actually served for `path` in `locale`.
 *
 * The default-locale home page is served at `/` — `/en` only exists as the internal rewrite
 * target of `proxy.ts`, so it must never be advertised as a canonical URL. Every other route
 * keeps its locale prefix because unprefixed paths redirect (`/docs/...` -> `/en/docs/...`).
 */
export function localizedPath(locale: string, path = "/"): string {
  const normalizedPath = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;

  if (!normalizedPath && normalizeLocale(locale) === DEFAULT_LOCALE) return "/";

  return `/${normalizeLocale(locale)}${normalizedPath}`;
}

export function absoluteUrl(path: string): string {
  const url = new URL(path, siteConfig.siteUrl);

  return url.pathname === "/" && !url.search && !url.hash ? url.origin : url.toString();
}
