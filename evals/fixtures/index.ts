import type {FixtureDefinition} from "../src/types.ts";

import {join} from "node:path";

export const SNAPSHOT_IGNORE: readonly string[] = [
  "node_modules",
  "dist",
  ".next",
  ".git",
  "vendor",
  "package-lock.json",
  "next-env.d.ts",
  "*.tsbuildinfo",
];

const TSC = ["node_modules/.bin/tsc", "--noEmit", "--pretty", "false"];

export const fixtures: Record<string, FixtureDefinition> = {
  "next-app": {
    build: [["node_modules/.bin/next", "build"]],
    builtCssDir: ".next/static",
    clean: [".next"],
    dir: join(import.meta.dirname, "next-app"),
    id: "next-app",
    prepare: [["node_modules/.bin/next", "typegen"]],
    typecheck: [["node_modules/.bin/next", "typegen"], TSC],
  },
  "vite-app": {
    build: [["node_modules/.bin/vite", "build"]],
    builtCssDir: "dist/assets",
    clean: ["dist"],
    dir: join(import.meta.dirname, "vite-app"),
    id: "vite-app",
    prepare: [],
    typecheck: [TSC],
  },
};

export function getFixture(id: string): FixtureDefinition {
  const fixture = fixtures[id];

  if (!fixture) {
    throw new Error(`unknown fixture "${id}"; known: ${Object.keys(fixtures).join(", ")}`);
  }

  return fixture;
}
