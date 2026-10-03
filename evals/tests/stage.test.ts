import {describe, expect, it} from "vitest";

import {
  findForbidden,
  rewriteReactManifest,
  rewriteStylesManifest,
  stripCssComments,
} from "../src/pack/stage.ts";

const react = {
  dependencies: {"@peakui/styles": "workspace:*", "tailwind-variants": "^3.3.1"},
  devDependencies: {vitest: "^3.2.4"},
  exports: {
    ".": {default: "./src/index.ts", import: "./src/index.ts", types: "./src/index.ts"},
    "./package.json": "./package.json",
  },
  files: ["src"],
  name: "@peakui/react",
  peerDependencies: {react: ">=19.0.0"},
  scripts: {build: "tsdown"},
  version: "0.0.0",
};

describe("rewriteReactManifest", () => {
  const out = rewriteReactManifest(react, "0.0.0");

  it("points the root export at dist", () => {
    expect(out.exports).toEqual({
      ".": {default: "./dist/index.mjs", import: "./dist/index.mjs", types: "./dist/index.d.mts"},
      "./package.json": "./package.json",
    });
    expect(out.files).toEqual(["dist"]);
  });

  it("replaces the workspace protocol and drops scripts and devDependencies", () => {
    expect(out.dependencies).toEqual({"@peakui/styles": "0.0.0", "tailwind-variants": "^3.3.1"});
    expect(out).not.toHaveProperty("scripts");
    expect(out).not.toHaveProperty("devDependencies");
    expect(out.peerDependencies).toEqual({react: ">=19.0.0"});
  });
});

describe("rewriteStylesManifest", () => {
  const out = rewriteStylesManifest({
    exports: {
      ".": {
        default: "./src/index.ts",
        import: "./src/index.ts",
        style: "./index.css",
        types: "./src/index.ts",
      },
      "./components/*": {default: "./src/components/*/index.ts"},
      "./components/*.css": "./components/*.css",
      "./css": {default: "./index.css", style: "./index.css"},
      "./generator": {default: "./src/generator/index.ts"},
      "./presets": {default: "./presets/index.ts"},
    },
    files: ["src", "presets", "themes", "base", "utilities", "variants", "components", "index.css"],
    name: "@peakui/styles",
    scripts: {test: "vitest run"},
  });

  it("points the root export at dist and keeps the CSS exports", () => {
    const exports = out.exports as Record<string, unknown>;

    expect(exports["."]).toEqual({
      default: "./dist/index.js",
      import: "./dist/index.js",
      style: "./index.css",
      types: "./dist/index.d.ts",
    });
    expect(exports["./css"]).toEqual({default: "./index.css", style: "./index.css"});
    expect(exports["./components/*.css"]).toBe("./components/*.css");
  });

  it("drops the TypeScript-only entry points", () => {
    const exports = out.exports as Record<string, unknown>;

    expect(exports).not.toHaveProperty("./components/*");
    expect(exports).not.toHaveProperty("./generator");
    expect(exports).not.toHaveProperty("./presets");
    expect(out.files).toEqual([
      "dist",
      "themes",
      "base",
      "utilities",
      "variants",
      "components",
      "index.css",
    ]);
  });
});

describe("stripCssComments", () => {
  it("removes every comment and keeps the rules", () => {
    const css = '/* contract */\n@import "./a.css";\n.button {\n  /* why */\n  color: red;\n}\n';
    const out = stripCssComments(css);

    expect(out).not.toContain("/*");
    expect(out).toContain('@import "./a.css";');
    expect(out).toContain("color: red;");
  });
});

describe("findForbidden", () => {
  it("returns the paths that name the reference library, in any case", () => {
    const hit = ["Hero", "UI"].join("");

    expect(
      findForbidden([
        {path: "index.css", text: `/* like @${hit.toLowerCase()}/styles */`},
        {path: "dist/index.js", text: "export {};"},
        {path: "dist/a.d.ts", text: `// ${hit} v3`},
      ]),
    ).toEqual(["dist/a.d.ts", "index.css"]);
  });
});
