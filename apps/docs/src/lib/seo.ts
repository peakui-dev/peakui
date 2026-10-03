import {siteConfig} from "@/config/site";

export function absoluteUrl(path: string): string {
  const url = new URL(path, siteConfig.siteUrl);

  return url.pathname === "/" && !url.search && !url.hash ? url.origin : url.toString();
}
