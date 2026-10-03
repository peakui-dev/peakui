"use client";

import type {LinkProps} from "fumadocs-core/link";
import type {Ref} from "react";

import {useParams} from "fumadocs-core/framework";
import NextLink from "next/link";
import {useMemo} from "react";

import {i18n} from "@/lib/i18n";

const LOCALE_PREFIX = new RegExp(`^/(${i18n.languages.join("|")})(/|$)`);

/**
 * Prefixes internal docs paths with `/[lang]` for dynamic resolution.
 * Paths already localized or external are left unchanged.
 */
export function localizeHref(href?: string): string | undefined {
  if (!href) return href;

  if (
    href.startsWith("http") ||
    href.startsWith("mailto:") ||
    href.startsWith("#") ||
    href.startsWith("/[lang]")
  ) {
    return href;
  }

  if (LOCALE_PREFIX.test(href)) return href;
  if (href.startsWith("/docs")) return `/[lang]${href}`;

  return href;
}

function resolveLocaleHref(
  href: string | undefined,
  params: Record<string, string | string[] | undefined>,
): string | undefined {
  const localized = localizeHref(href);

  if (!localized) return localized;

  return localized.replace(/\[(.*?)\]/g, (_, key: string) => {
    const value = params[key];

    if (!value) return i18n.defaultLanguage;

    return typeof value === "string" ? value : value.join("/");
  });
}

export function LocaleLink({
  children,
  external: externalProp,
  href = "#",
  prefetch,
  ref,
  ...props
}: LinkProps & {ref?: Ref<HTMLAnchorElement>}) {
  const params = useParams();
  const url = useMemo(() => resolveLocaleHref(href, params), [href, params]);
  const external = externalProp ?? Boolean(url?.match(/^\w+:/) || url?.startsWith("//"));

  if (external) {
    return (
      <a ref={ref} href={url} rel="noreferrer noopener" target="_blank" {...props}>
        {children}
      </a>
    );
  }

  return (
    <NextLink ref={ref} href={url ?? "#"} prefetch={prefetch} {...props}>
      {children}
    </NextLink>
  );
}
