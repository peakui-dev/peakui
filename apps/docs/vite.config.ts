import type {Plugin} from "vite";

import {readFileSync, readdirSync} from "node:fs";
import {join, resolve} from "node:path";

import {cloudflare} from "@cloudflare/vite-plugin";
import {imagesOptimizer} from "@vinext/cloudflare/images/images-optimizer";
import mdx from "fumadocs-mdx/vite";
import vinext from "vinext";
import {defineConfig} from "vite";

const ROOT = import.meta.dirname;
const VIRTUAL_ID = "\0virtual:peakui-raw-sources";

/*
 * A Worker has no filesystem, but the docs markdown pipeline reads MDX pages and demo
 * sources from disk. This plugin inlines them at build time as one virtual module — a
 * Record<posix path, raw text> — which read-source.worker.ts consumes. import.meta.glob is
 * not an option: the fumadocs MDX transform compiles ?raw .mdx modules before the raw query
 * can win.
 */
function rawSources(): Plugin {
  let code = "export default {}";

  const walk = function* (absolute: string, prefix: string): Generator<string> {
    for (const entry of readdirSync(absolute, {withFileTypes: true})) {
      const child = join(absolute, entry.name);

      if (entry.isDirectory()) {
        yield* walk(child, `${prefix}/${entry.name}`);
      } else {
        yield `${prefix}/${entry.name}`;
      }
    }
  };

  return {
    name: "peakui-raw-sources",
    buildStart() {
      const entries = [
        ...walk(join(ROOT, "content/docs"), "/content/docs"),
        ...walk(join(ROOT, "src/demos"), "/src/demos"),
      ]
        .filter((path) => /\.(mdx|ts|tsx)$/.test(path))
        .map((path) => [path, readFileSync(join(ROOT, `.${path}`), "utf8")] as const);

      code = `export default {${entries
        .map(([path, text]) => `${JSON.stringify(path)}: ${JSON.stringify(text)}`)
        .join(",")}}`;
    },
    load(id) {
      if (id === VIRTUAL_ID) {
        return code;
      }
    },
    resolveId(source) {
      if (source === "virtual:peakui-raw-sources") {
        return VIRTUAL_ID;
      }
    },
  };
}

export default defineConfig(async () => ({
  plugins: [
    // Resolves and compiles the MDX content. The plugin takes the source.config.ts module
    // namespace (collections + default MDX options) — same shape `loadConfig` feeds the Next
    // plugin. `mdx({})` or `mdx()` both mis-load it and emit an export-less .source/server.ts.
    await mdx(await import("./source.config")),
    rawSources(),
    vinext({
      images: {optimizer: imagesOptimizer()},
    }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
  resolve: {
    alias: [
      // fumadocs-mdx generates server.ts/browser.ts/dynamic.ts; the `@/.source` import in
      // src/lib/source.ts must land on the server entry. The plugin's own updateViteConfig
      // does not cover the vinext RSC environment, so the alias is explicit.
      {find: "@/.source", replacement: resolve(ROOT, ".source/server.ts")},
      // A Worker has no filesystem: swap the fs-backed source reader for its worker twin
      // that reads the same files from the bundle.
      {find: "@/lib/read-source", replacement: resolve(ROOT, "src/lib/read-source.worker.ts")},
    ],
  },
}));
