import {siteConfig} from "@/config/site";
import {i18n} from "@/lib/i18n";

interface AcceptEntry {
  mediaType: string;
  q: number;
}

function parseAcceptHeader(accept: string): AcceptEntry[] {
  return accept
    .split(",")
    .map((entry) => {
      const [mediaType = "", ...params] = entry.split(";").map((part) => part.trim());
      const qParam = params.find((param) => param.startsWith("q="));
      const q = qParam ? Number(qParam.slice(2)) : 1;

      return {
        mediaType: mediaType.toLowerCase(),
        q: Number.isFinite(q) ? q : 1,
      };
    })
    .filter((entry) => entry.mediaType.length > 0 && entry.q > 0)
    .sort((a, b) => b.q - a.q);
}

function getQuality(entries: AcceptEntry[], mediaType: string): number {
  const exact = entries.find((entry) => entry.mediaType === mediaType);

  if (exact) return exact.q;

  const [type] = mediaType.split("/");
  const typeWildcard = entries.find((entry) => entry.mediaType === `${type}/*`);

  if (typeWildcard) return typeWildcard.q;

  const allWildcard = entries.find((entry) => entry.mediaType === "*/*");

  return allWildcard?.q ?? 0;
}

/** True when the request names `text/markdown` and does not prefer HTML over it. */
export function acceptsMarkdown(request: Request): boolean {
  const accept = request.headers.get("accept");

  if (!accept) return false;

  const entries = parseAcceptHeader(accept);
  const explicitMarkdown = entries.find((entry) => entry.mediaType === "text/markdown");

  if (!explicitMarkdown) return false;

  return explicitMarkdown.q >= getQuality(entries, "text/html");
}

export function getHomepageMarkdown(origin: string): string {
  const baseUrl = origin.replace(/\/$/, "");

  return `# ${siteConfig.name}

${siteConfig.description}

## Start here

- [Introduction](${baseUrl}/docs/react/getting-started)
- [Quick start](${baseUrl}/docs/react/getting-started/quick-start)
- [Components](${baseUrl}/docs/react/components)

## Agent resources

- [Documentation index](${baseUrl}/llms.txt)
- [All component pages](${baseUrl}/llms-components.txt)
- [All guides: every page that is not a component page](${baseUrl}/llms-patterns.txt)
- [Pages index (JSON): every component and guide, with links to each page](${baseUrl}/api/components)
`;
}

/** Splits `/en/docs/react/x` or `/docs/react/x` into the locale and the page slug. */
export function resolveDocsPath(pathname: string): {lang?: string; slug: string[]} | null {
  const parts = pathname
    .replace(/\.mdx?$/, "")
    .split("/")
    .filter(Boolean);
  const first = parts[0];
  const lang = first && (i18n.languages as readonly string[]).includes(first) ? first : undefined;
  const rest = lang ? parts.slice(1) : parts;

  if (rest[0] !== "docs" || rest.length < 2) return null;

  return {lang, slug: rest.slice(1)};
}
