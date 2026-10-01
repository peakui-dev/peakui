/** Generates every preset's theme files. Run: pnpm tokens:build */

import {mkdirSync, writeFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";

import {presets} from "../presets/index.ts";
import {buildTheme, deriveTheme} from "../src/generator/index.ts";

const root = resolve(import.meta.dirname, "..");
let adjusted = 0;

for (const preset of presets) {
  const {fixes} = deriveTheme(preset);

  for (const fix of fixes) {
    adjusted += 1;
    console.warn(
      `  ! ${preset.id}: «${fix.token}» светлота ${fix.from.toFixed(3)} → ${fix.to.toFixed(3)} ` +
        `для контраста ${fix.ratio.toFixed(2)}:1`,
    );
  }

  for (const file of buildTheme(preset)) {
    const target = join(root, file.path);

    mkdirSync(dirname(target), {recursive: true});
    writeFileSync(target, file.css, "utf8");
    console.log(`  + ${file.path}`);
  }
}

console.log(
  adjusted === 0
    ? "\nКонтраст: правок не потребовалось — палитры держат AA сами."
    : `\nКонтраст: ${adjusted} правок светлоты (см. выше).`,
);
