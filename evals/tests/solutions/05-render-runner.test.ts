import type {Workspace} from "../../src/workspace/workspace.ts";

import {mkdirSync, writeFileSync} from "node:fs";
import {dirname, join} from "node:path";

import {afterAll, describe, expect, it} from "vitest";

import {getFixture} from "../../fixtures/index.ts";
import {readTemplate} from "../../src/fixtures/prepare.ts";
import {renderSsr} from "../../src/scoring/render.ts";
import {createWorkspace, removeWorkspace} from "../../src/workspace/workspace.ts";

// These need a prepared vite-app template (`pnpm evals prepare`): the runner resolves Vite and
// React from the workspace.
const template = readTemplate(getFixture("vite-app"));
const made: Workspace[] = [];

function workspace(key: string, files: Record<string, string>): string {
  const created = createWorkspace({
    batch: "render-runner-test",
    key,
    overlayDir: undefined,
    templateDir: template!.dir,
  });

  made.push(created);

  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(created.dir, path)), {recursive: true});
    writeFileSync(join(created.dir, path), text);
  }

  return created.dir;
}

afterAll(() => {
  for (const created of made) removeWorkspace(created);
});

async function render(dir: string, module: string, exportName: string) {
  return renderSsr(dir, {cases: [{name: "default", props: {}}], exportName, module});
}

describe.skipIf(!template)("the render runner", () => {
  it("survives console output from the agent's module", async () => {
    const dir = workspace("console", {
      "src/components/C.tsx": `console.log("module-level noise");\nexport function C() {\n  console.log("render noise");\n  console.error("stderr noise");\n\n  return <p>hello</p>;\n}\n`,
    });
    const result = await render(dir, "/src/components/C.tsx", "C");

    expect(result).toMatchObject({ok: true});
    expect(result.ok && result.documents.default).toContain("hello");
  });

  it("renders an export wrapped in memo() or forwardRef()", async () => {
    const dir = workspace("wrapped", {
      "src/components/W.tsx": `import {forwardRef, memo} from "react";\n\nexport const M = memo(function M() {\n  return <i>memo</i>;\n});\nexport const F = forwardRef<HTMLElement>(function F(_props, ref) {\n  return <b ref={ref}>fwd</b>;\n});\n`,
    });

    for (const [name, text] of [
      ["M", "memo"],
      ["F", "fwd"],
    ] as const) {
      const result = await render(dir, "/src/components/W.tsx", name);

      expect(result, name).toMatchObject({ok: true});
      expect(result.ok && result.documents.default).toContain(text);
    }
  });

  it("says so for an export that is not a component", async () => {
    const dir = workspace("not-component", {"src/components/N.tsx": `export const N = 42;\n`});
    const result = await render(dir, "/src/components/N.tsx", "N");

    expect(result).toMatchObject({ok: false});
    expect(!result.ok && result.error).toContain("no exported component");
  });

  it("honours a path alias from the workspace's Vite configuration", async () => {
    const dir = workspace("vite-alias", {
      "src/components/A.tsx": `import {label} from "@/lib/label";\n\nexport function A() {\n  return <p>{label}</p>;\n}\n`,
      "src/lib/label.ts": `export const label = "aliased";\n`,
      "vite.config.ts": `import {fileURLToPath} from "node:url";\n\nimport tailwindcss from "@tailwindcss/vite";\nimport react from "@vitejs/plugin-react";\nimport {defineConfig} from "vite";\n\nexport default defineConfig({\n  plugins: [react(), tailwindcss()],\n  resolve: {alias: {"@": fileURLToPath(new URL("./src", import.meta.url))}},\n});\n`,
    });
    const result = await render(dir, "/src/components/A.tsx", "A");

    expect(result).toMatchObject({ok: true});
    expect(result.ok && result.documents.default).toContain("aliased");
  });

  it("honours the paths of the workspace's tsconfig", async () => {
    const dir = workspace("tsconfig-paths", {
      "src/components/P.tsx": `import {label} from "~/lib/label";\n\nexport function P() {\n  return <p>{label}</p>;\n}\n`,
      "src/lib/label.ts": `export const label = "from-tsconfig";\n`,
      "tsconfig.json": JSON.stringify({
        compilerOptions: {
          baseUrl: ".",
          jsx: "react-jsx",
          module: "ESNext",
          moduleResolution: "bundler",
          paths: {"~/*": ["./src/*"]},
          strict: true,
          target: "ES2022",
        },
        include: ["src"],
      }),
    });
    const result = await render(dir, "/src/components/P.tsx", "P");

    expect(result).toMatchObject({ok: true});
    expect(result.ok && result.documents.default).toContain("from-tsconfig");
  });

  it("does not hand the parent's environment to the agent's code", async () => {
    process.env.PEAKUI_RENDER_SECRET = "leaked";

    try {
      const dir = workspace("env", {
        "src/components/E.tsx": `export function E() {\n  return <p>{process.env.PEAKUI_RENDER_SECRET ?? "absent"}</p>;\n}\n`,
      });
      const result = await render(dir, "/src/components/E.tsx", "E");

      expect(result).toMatchObject({ok: true});
      expect(result.ok && result.documents.default).toContain("absent");
    } finally {
      delete process.env.PEAKUI_RENDER_SECRET;
    }
  });

  it("returns once the result is produced even if the module left a timer running", async () => {
    const dir = workspace("timer", {
      "src/components/T.tsx": `setInterval(() => {}, 1000);\n\nexport function T() {\n  return <p>timer</p>;\n}\n`,
    });
    const started = Date.now();
    const result = await render(dir, "/src/components/T.tsx", "T");

    expect(result).toMatchObject({ok: true});
    expect(Date.now() - started).toBeLessThan(30_000);
  });
});
