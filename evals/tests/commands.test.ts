import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

import {afterEach, beforeEach, describe, expect, it} from "vitest";

import {
  classifyBuildOutput,
  classifyDiagnostic,
  cleanBuildOutput,
  parseTscOutput,
  runBuild,
  runTypecheck,
} from "../src/scoring/commands.ts";

const TSC_OUTPUT = [
  `src/a.tsx(2,9): error TS2305: Module '"@peakui/react"' has no exported member 'PeakUIProvider'.`,
  `src/a.tsx(3,28): error TS2307: Cannot find module '@peakui/react/button' or its corresponding type declarations.`,
  `src/a.tsx(7,25): error TS2322: Type '{ label: string; isRequired: true; errorMessage: string; }' is not assignable to type 'IntrinsicAttributes & InputRootProps'.`,
  `  Property 'label' does not exist on type 'IntrinsicAttributes & InputRootProps'.`,
  `src/b.tsx(10,41): error TS2322: Type '"bordered"' is not assignable to type '"danger" | "danger-soft" | "ghost" | "outline" | "primary" | "secondary" | "tertiary" | undefined'.`,
].join("\n");

describe("parseTscOutput", () => {
  const diagnostics = parseTscOutput(TSC_OUTPUT);

  it("reads file, position and code", () => {
    expect(diagnostics).toHaveLength(4);
    expect(diagnostics[0]).toMatchObject({code: "TS2305", column: 9, file: "src/a.tsx", line: 2});
    expect(diagnostics[3]).toMatchObject({file: "src/b.tsx", line: 10});
  });

  it("joins indented continuation lines into the message", () => {
    expect(diagnostics[2]!.message).toContain("Property 'label' does not exist");
  });

  it("returns nothing for output without diagnostics", () => {
    expect(parseTscOutput("")).toEqual([]);
    expect(parseTscOutput("Generating route types...\n✓ Types generated successfully")).toEqual([]);
  });
});

describe("classifyDiagnostic", () => {
  it.each([
    [
      "Module '\"@peakui/react\"' has no exported member 'PeakUIProvider'.",
      "provider",
      "no-provider",
    ],
    ["Module '\"@peakui/react\"' has no exported member 'Card'.", "unknown-export", "imports"],
    [
      "Cannot find module '@peakui/react/button' or its corresponding type declarations.",
      "deep-import",
      "imports",
    ],
    [
      "Type '{…}' is not assignable.\n  Property 'label' does not exist on type 'IntrinsicAttributes & InputRootProps'.",
      "unknown-composition-prop",
      "composition",
    ],
    [
      "Property 'as' does not exist on type 'IntrinsicAttributes & ButtonRootProps'.",
      "unknown-composition-prop",
      "composition",
    ],
    [
      "Property 'classNames' does not exist on type 'X'. Did you mean 'className'?",
      "unknown-composition-prop",
      "composition",
    ],
    [
      "Property 'startContent' does not exist on type 'X'.",
      "unknown-composition-prop",
      "composition",
    ],
    [
      "Property 'isLoading' does not exist on type 'IntrinsicAttributes & ButtonRootProps'.",
      "unknown-state-prop",
      "rac-props",
    ],
    [
      "Property 'disabled' does not exist on type 'X'. Did you mean 'isDisabled'?",
      "unknown-state-prop",
      "rac-props",
    ],
    [
      'Type \'"bordered"\' is not assignable to type \'"danger" | "danger-soft" | "ghost" | undefined\'.',
      "unknown-variant",
      "variants",
    ],
    [
      'Type \'"small"\' is not assignable to type \'"lg" | "md" | "sm" | undefined\'.',
      "unknown-variant",
      "variants",
    ],
    ["Property 'radius' does not exist on type 'X'.", "unknown-variant", "variants"],
    ["Type 'number' is not assignable to type 'string'.", "type-error", "other"],
  ])("%s -> %s", (message, rule, pitfall) => {
    expect(classifyDiagnostic(message)).toEqual({pitfall, rule});
  });
});

describe("classifyBuildOutput", () => {
  it("recognises a function crossing the server boundary", () => {
    const [event] = classifyBuildOutput(
      "Error: Event handlers cannot be passed to Client Component props.",
    );
    const [fn] = classifyBuildOutput(
      "Error: Functions cannot be passed directly to Client Components unless you explicitly expose it",
    );

    expect(event).toMatchObject({
      gate: true,
      pass: false,
      pitfall: "peers-rsc",
      rule: "function-across-server-boundary",
    });
    expect(fn).toMatchObject({rule: "function-across-server-boundary"});
  });

  it("recognises PeakUI styles compiled without Tailwind", () => {
    expect(
      classifyBuildOutput("Error: Cannot apply unknown utility class `gap-2`")[0],
    ).toMatchObject({
      pitfall: "css-order",
      rule: "styles-without-tailwind",
    });
  });

  it("falls back to one build-error finding carrying the first error line", () => {
    const findings = classifyBuildOutput(
      "vite v8\nerror during build:\nBuild failed with 1 error:\nsomething else",
    );

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({pitfall: "other", rule: "build-error"});
    expect(findings[0]!.message).toContain("error during build");
  });

  it("reports each known rule once", () => {
    const line = "Error: Event handlers cannot be passed to Client Component props.";

    expect(classifyBuildOutput(`${line}\n${line}`)).toHaveLength(1);
  });
});

describe("cleanBuildOutput", () => {
  it("removes the fixture's output directories and nothing else", () => {
    const dir = mkdtempSync(join(tmpdir(), "clean-"));

    mkdirSync(join(dir, "dist/assets"), {recursive: true});
    mkdirSync(join(dir, "src"));
    writeFileSync(join(dir, "dist/assets/stale.css"), ".button{}");
    writeFileSync(join(dir, "src/a.ts"), "a");

    cleanBuildOutput(
      {
        build: [],
        builtCssDir: "dist/assets",
        clean: ["dist"],
        dir: "",
        id: "x",
        prepare: [],
        typecheck: [],
      },
      dir,
    );

    expect(existsSync(join(dir, "dist"))).toBe(false);
    expect(existsSync(join(dir, "src/a.ts"))).toBe(true);
  });
});

describe("the environment of type-check and build commands", () => {
  let dir: string;
  let home: string;
  let previousHome: string | undefined;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "cmd-env-"));
    home = mkdtempSync(join(tmpdir(), "cmd-home-"));
    previousHome = process.env.PEAKUI_EVALS_HOME;
    process.env.PEAKUI_EVALS_HOME = home;
  });

  afterEach(() => {
    if (previousHome === undefined) delete process.env.PEAKUI_EVALS_HOME;
    else process.env.PEAKUI_EVALS_HOME = previousHome;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    rmSync(dir, {force: true, recursive: true});
    rmSync(home, {force: true, recursive: true});
  });

  const dump = ["node", "-e", "process.stdout.write(JSON.stringify(process.env))"];
  const fixture = {
    build: [dump],
    builtCssDir: "dist",
    clean: [],
    dir: "",
    id: "x",
    prepare: [],
    typecheck: [dump],
  };

  function envOf(logPath: string): Record<string, string> {
    const text = readFileSync(logPath, "utf8");

    return JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  }

  it.each(["typecheck", "build"] as const)(
    "%s sees an allow-list, not the parent's secrets",
    async (layer) => {
      process.env.ANTHROPIC_API_KEY = "sk-ant-secret";
      process.env.AWS_SECRET_ACCESS_KEY = "aws-secret";

      const logPath = join(dir, `${layer}.log`);

      await (layer === "typecheck" ? runTypecheck : runBuild)(fixture, dir, logPath);

      const env = envOf(logPath);

      expect(env).not.toHaveProperty("ANTHROPIC_API_KEY");
      expect(env).not.toHaveProperty("AWS_SECRET_ACCESS_KEY");
      expect(readFileSync(logPath, "utf8")).not.toContain("sk-ant-secret");
      expect(env.PATH).toBe(process.env.PATH);
      expect(env.NO_COLOR).toBe("1");
      expect(env.CI).toBe("1");
      expect(env.HOME!.startsWith(home)).toBe(true);
      expect(env.HOME).not.toBe(process.env.HOME);
      expect(existsSync(env.HOME!)).toBe(true);
    },
  );
});
