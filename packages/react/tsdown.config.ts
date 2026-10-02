import {readdirSync} from "node:fs";
import {join} from "node:path";

import {defineConfig} from "tsdown";

import {requireClientDirectives} from "./scripts/require-client-directives.ts";

/*
 * unbundle: один выходной файл на один исходный модуль. Это даёт per-component tree-shaking без
 * ручной связки preserveModules + preserveModulesRoot, которую эталон настраивает в rollup, и —
 * главное — оставляет "use client" на своём модуле, а не сливает всё в один чанк, где директива
 * относилась бы ко всему пакету сразу.
 */

const componentEntries = readdirSync("src/components", {withFileTypes: true})
  .filter((entry) => entry.isDirectory())
  .map((entry) => join("src/components", entry.name, "index.ts"));

export default defineConfig({
  dts: true,
  entry: ["src/index.ts", ...componentEntries],
  format: "esm",
  outDir: "dist",
  plugins: [requireClientDirectives()],
  unbundle: true,
});
