import {describe, expect, it} from "vitest";

import {
  commentInventory,
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

describe("stripCssComments in non-node positions", () => {
  it("removes a comment inside a selector", () => {
    const out = stripCssComments(".a /* why */ .b, .c /* x */ { color: red; }");

    expect(out).not.toContain("/*");
    expect(out).toContain("color: red;");
  });

  it("removes a comment inside a declaration value and at-rule parameters", () => {
    const out = stripCssComments(
      "@media /* wide */ (min-width: 10px) { .a { color: red /* c */; margin: 0 /* m */ 1px; } }",
    );

    expect(out).not.toContain("/*");
    expect(out).toContain("margin:");
  });

  it("removes a comment between a property and its colon", () => {
    expect(stripCssComments(".a { color /* c */ : red; }")).not.toContain("/*");
  });

  it("fails when a comment opener survives, for example inside a string", () => {
    expect(() => stripCssComments('.a { content: "/*"; }')).toThrow(/comment/);
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

describe("commentInventory", () => {
  const files = [
    {
      path: "dist/a.mjs",
      text: "// first\nconst a = `/* not a comment */`;\n/** doc */\nexport {a}; // trailing\nconst r = /\\/\\/x/;\n",
    },
    {path: "dist/b.d.ts", text: "/** Кнопка основная */\nexport declare const b: 1;\n"},
    {path: "dist/c.js", text: "export const c = 1;\n"},
    {path: "dist/readme.txt", text: "// ignored: not JavaScript or TypeScript\n"},
  ];

  it("counts comments in JavaScript and declaration files only", () => {
    const inventory = commentInventory(files);

    expect(inventory.files).toBe(3);
    expect(inventory.comments).toBe(4);
  });

  it("counts the comments that contain Cyrillic characters", () => {
    expect(commentInventory(files).cyrillic).toBe(1);
  });

  it("keeps at most five short samples with their file names, Cyrillic first", () => {
    const many = [
      {path: "dist/m.mjs", text: Array.from({length: 9}, (_, i) => `// note ${i}`).join("\n")},
      ...files,
    ];
    const inventory = commentInventory(many);

    expect(inventory.samples).toHaveLength(5);
    expect(inventory.samples[0]).toEqual({file: "dist/b.d.ts", text: "Кнопка основная"});
    expect(inventory.samples.every((sample) => sample.text.length <= 80)).toBe(true);
  });

  it("reads a multi-line doc comment as one line without its asterisks", () => {
    const inventory = commentInventory([
      {path: "dist/d.d.ts", text: "/**\n * First line\n * second line\n */\nexport declare const d: 1;\n"},
    ]);

    expect(inventory.samples).toEqual([{file: "dist/d.d.ts", text: "First line second line"}]);
  });

  it("returns zeros for no files", () => {
    expect(commentInventory([])).toEqual({comments: 0, cyrillic: 0, files: 0, samples: []});
  });
});
