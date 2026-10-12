import {readFile} from "node:fs/promises";
import {join} from "node:path";

/*
 * Reads docs pages and demo sources from the checkout. The Next build serves from the file
 * system, so plain fs is correct there. The vinext build swaps this module for
 * read-source.worker.ts (see the alias in vite.config.ts), where a Worker has no filesystem
 * and the sources are inlined at build time instead.
 */

const ROOT = process.cwd();

export function readDocsSource(pagePath: string): Promise<string> {
  return readFile(join(ROOT, "content/docs", pagePath), "utf-8");
}

export function readDemoSource(demoFile: string): Promise<string> {
  return readFile(join(ROOT, "src/demos", demoFile), "utf-8");
}
