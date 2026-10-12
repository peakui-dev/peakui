/// <reference types="vite/client" />

/*
 * Worker twin of read-source.ts: a Worker has no filesystem, so the docs pages and demo
 * sources are inlined at build time through the virtual module emitted by the rawSources
 * plugin in vite.config.ts (import.meta.glob is not usable here — the fumadocs MDX transform
 * compiles ?raw .mdx modules before the raw query can win). Selected by the read-source
 * alias in vite.config.ts; the fs twin keeps serving the Next build.
 */

import rawSources from "virtual:peakui-raw-sources";

export function readDocsSource(pagePath: string): Promise<string> {
  const content = rawSources[`/content/docs/${pagePath}`];

  if (content === undefined) {
    return Promise.reject(new Error(`no bundled docs source for ${pagePath}`));
  }

  return Promise.resolve(content);
}

export function readDemoSource(demoFile: string): Promise<string> {
  const content = rawSources[`/src/demos/${demoFile}`];

  if (content === undefined) {
    return Promise.reject(new Error(`no bundled demo source for ${demoFile}`));
  }

  return Promise.resolve(content);
}
