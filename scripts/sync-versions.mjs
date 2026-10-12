import {readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

/*
 * The exported `version` const of @peakui/styles is public API; this copies the manifest
 * version into it. Runs as part of the changesets `version` step, so the Version Packages PR
 * always carries a truthful constant.
 */

const CONST = /^export const version = ".*";$/m;

export function renderVersionConst(source, version) {
  if (!CONST.test(source)) {
    throw new Error('packages/styles/src/index.ts: `export const version = "…"` line not found');
  }

  return source.replace(CONST, `export const version = "${version}";`);
}

function main() {
  const manifest = JSON.parse(readFileSync(join("packages", "styles", "package.json"), "utf8"));
  const file = join("packages", "styles", "src", "index.ts");
  const updated = renderVersionConst(readFileSync(file, "utf8"), manifest.version);

  writeFileSync(file, updated);
  console.log(`sync-versions: @peakui/styles version const -> ${manifest.version}`);
}

if (process.argv[1]?.endsWith("sync-versions.mjs")) {
  main();
}
