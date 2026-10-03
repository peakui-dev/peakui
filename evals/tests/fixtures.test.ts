import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

import {afterEach, beforeEach, describe, expect, it} from "vitest";

import {fixtures, getFixture} from "../fixtures/index.ts";
import {readFiles, walkFiles} from "../src/files.ts";
import {
  fixtureHash,
  readTemplate,
  templateIsCurrent,
  withTarballDependencies,
} from "../src/fixtures/prepare.ts";

const OTHER_LIBRARIES =
  /hero\s?ui|next\s?ui|shadcn|radix|material[- ]ui|\bmui\b|chakra|mantine|ant design|\bantd\b|daisy\s?ui|headless ui|bootstrap/i;

describe("fixtures", () => {
  it.each(Object.values(fixtures))("$id names no UI library other than PeakUI", (fixture) => {
    const files = readFiles(fixture.dir, walkFiles(fixture.dir));

    expect(files.length).toBeGreaterThan(5);
    expect(
      files.filter((file) => OTHER_LIBRARIES.test(file.text)).map((file) => file.path),
    ).toEqual([]);
  });

  it.each(Object.values(fixtures))("$id carries no agent file and no readme", (fixture) => {
    const names = walkFiles(fixture.dir).map((path) => path.toLowerCase());

    expect(
      names.filter((name) => /(^|\/)(agents\.md|claude\.md|readme\.md|\.mcp\.json)$/.test(name)),
    ).toEqual([]);
    expect(
      names.filter((name) => name.startsWith(".claude/") || name.startsWith(".cursor/")),
    ).toEqual([]);
  });

  it("vite-app starts with PeakUI wired and no PeakUI component in use", () => {
    const [css, app] = readFiles(fixtures["vite-app"]!.dir, ["src/index.css", "src/App.tsx"]);

    expect(css!.text.indexOf("tailwindcss")).toBeLessThan(css!.text.indexOf("@peakui/styles/css"));
    expect(app!.text).not.toContain("@peakui/react");
  });

  it("next-app starts with PeakUI not wired", () => {
    const files = readFiles(fixtures["next-app"]!.dir, walkFiles(fixtures["next-app"]!.dir));

    expect(
      files
        .filter((file) => file.path !== "package.json" && file.text.includes("@peakui"))
        .map((f) => f.path),
    ).toEqual([]);
  });

  it("the shared-package stand-in names no UI library", () => {
    const dir = join(import.meta.dirname, "../fixtures/packages/acme-status");
    const files = readFiles(dir, walkFiles(dir));

    expect(files).toHaveLength(3);
    expect(
      files
        .filter((file) => OTHER_LIBRARIES.test(file.text) || /peakui/i.test(file.text))
        .map((file) => file.path),
    ).toEqual([]);
  });

  it("rejects an unknown fixture", () => {
    expect(() => getFixture("nope")).toThrow(/unknown fixture "nope"/);
  });
});

describe("templates", () => {
  it("fixtureHash is stable and 64 hex characters", () => {
    const fixture = fixtures["vite-app"]!;

    expect(fixtureHash(fixture)).toBe(fixtureHash(fixture));
    expect(fixtureHash(fixture)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("templateIsCurrent needs both hashes to match", () => {
    const sidecar = {fixtureHash: "f", libraryHash: "l"};

    expect(templateIsCurrent(sidecar, "f", "l")).toBe(true);
    expect(templateIsCurrent(sidecar, "f", "other")).toBe(false);
    expect(templateIsCurrent(sidecar, "other", "l")).toBe(false);
    expect(templateIsCurrent(undefined, "f", "l")).toBe(false);
    expect(templateIsCurrent("not an object", "f", "l")).toBe(false);
  });

  it("withTarballDependencies points each packed dependency at its tarball in vendor/", () => {
    const out = withTarballDependencies(
      {
        dependencies: {
          "@acme/status": "x",
          "@peakui/react": "x",
          "@peakui/styles": "x",
          react: "19.3.0",
        },
      },
      {
        acmeStatus: "/t/acme-status-1.4.0.tgz",
        react: "/t/peakui-react-0.1.0.tgz",
        styles: "/t/peakui-styles-0.1.0.tgz",
      },
    );

    expect(out.dependencies).toEqual({
      "@acme/status": "file:./vendor/acme-status-1.4.0.tgz",
      "@peakui/react": "file:./vendor/peakui-react-0.1.0.tgz",
      "@peakui/styles": "file:./vendor/peakui-styles-0.1.0.tgz",
      react: "19.3.0",
    });
  });

  it("withTarballDependencies does not add a dependency the fixture does not declare", () => {
    const out = withTarballDependencies(
      {dependencies: {"@peakui/react": "x", "@peakui/styles": "x"}},
      {acmeStatus: "/t/acme-status-1.4.0.tgz", react: "/t/r.tgz", styles: "/t/s.tgz"},
    );

    expect(out.dependencies).not.toHaveProperty("@acme/status");
  });
});

describe("readTemplate", () => {
  let home: string;
  let previous: string | undefined;
  const fixture = fixtures["vite-app"]!;

  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), "evals-template-"));
    previous = process.env.PEAKUI_EVALS_HOME;
    process.env.PEAKUI_EVALS_HOME = home;
    mkdirSync(join(home, "templates", fixture.id), {recursive: true});
  });

  afterEach(() => {
    if (previous === undefined) delete process.env.PEAKUI_EVALS_HOME;
    else process.env.PEAKUI_EVALS_HOME = previous;
    rmSync(home, {force: true, recursive: true});
  });

  function sidecar(text: string) {
    writeFileSync(join(home, "templates", `${fixture.id}.json`), text);
  }

  it("reads a well-formed sidecar", () => {
    sidecar(JSON.stringify({fixtureHash: "f", libraryHash: "l"}));

    expect(readTemplate(fixture)).toMatchObject({fixtureHash: "f", libraryHash: "l", reused: true});
  });

  it("is undefined when there is no sidecar", () => {
    expect(readTemplate(fixture)).toBeUndefined();
  });

  it.each([
    ["a missing hash", JSON.stringify({libraryHash: "l"})],
    ["a non-string hash", JSON.stringify({fixtureHash: 1, libraryHash: "l"})],
    ["an array", "[]"],
    ["text that is not JSON", "{oops"],
  ])("throws a clear error for %s", (_name, text) => {
    sidecar(text);

    expect(() => readTemplate(fixture)).toThrow(/template sidecar.*vite-app.*malformed/);
  });
});

describe("prepareTemplate", () => {
  it("runs a fixture's prepare commands without the parent's environment", async () => {
    const {prepareTemplate} = await import("../src/fixtures/prepare.ts");
    const home = mkdtempSync(join(tmpdir(), "prepare-env-"));
    const previous = process.env.PEAKUI_EVALS_HOME;
    const fixtureDir = join(home, "fixture");

    mkdirSync(fixtureDir, {recursive: true});
    writeFileSync(
      join(fixtureDir, "package.json"),
      JSON.stringify({name: "x", private: true, version: "0.0.0"}),
    );
    process.env.PEAKUI_EVALS_HOME = join(home, "evals-home");
    process.env.PEAKUI_PREPARE_SECRET = "leaked";

    try {
      await prepareTemplate(
        {
          build: [],
          builtCssDir: "dist",
          clean: [],
          dir: fixtureDir,
          id: "env-probe",
          prepare: [
            [
              process.execPath,
              "-e",
              "require('fs').writeFileSync('env.txt', process.env.PEAKUI_PREPARE_SECRET ?? 'absent')",
            ],
          ],
          typecheck: [],
        },
        {
          commentInventory: {comments: 0, cyrillic: 0, files: 0, samples: []},
          libraryHash: "l",
          tarballs: {acmeStatus: "a", react: "r", styles: "s"},
        },
        {force: true},
      );

      expect(
        readFileSync(join(home, "evals-home", "templates", "env-probe", "env.txt"), "utf8"),
      ).toBe("absent");
    } finally {
      delete process.env.PEAKUI_PREPARE_SECRET;
      if (previous === undefined) delete process.env.PEAKUI_EVALS_HOME;
      else process.env.PEAKUI_EVALS_HOME = previous;
      rmSync(home, {force: true, recursive: true});
    }
  }, 120_000);
});
