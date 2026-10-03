import type {PackResult, PackageManifest} from "../pack/stage.ts";
import type {FixtureDefinition} from "../types.ts";

import {copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {basename, join} from "node:path";

import {runCommand} from "../exec.ts";
import {copyDir, hashFiles, readFiles, walkFiles} from "../files.ts";
import {npmEnvironment} from "../npm.ts";
import {templatesDir} from "../paths.ts";

export interface TemplateInfo {
  fixture: string;
  dir: string;
  fixtureHash: string;
  libraryHash: string;
  reused: boolean;
}

export function fixtureHash(fixture: FixtureDefinition): string {
  const files = readFiles(fixture.dir, walkFiles(fixture.dir));

  files.push({
    path: "<commands>",
    text: JSON.stringify({
      build: fixture.build,
      prepare: fixture.prepare,
      typecheck: fixture.typecheck,
    }),
  });

  return hashFiles(files);
}

export function templateIsCurrent(
  sidecar: unknown,
  fixtureHashValue: string,
  libraryHash: string,
): boolean {
  if (typeof sidecar !== "object" || sidecar === null) return false;

  const record = sidecar as Record<string, unknown>;

  return record.fixtureHash === fixtureHashValue && record.libraryHash === libraryHash;
}

export function withTarballDependencies(
  manifest: PackageManifest,
  tarballs: PackResult["tarballs"],
): PackageManifest {
  const dependencies = {...(manifest.dependencies as Record<string, string> | undefined)};
  const packed: Record<string, string> = {
    "@acme/status": tarballs.acmeStatus,
    "@peakui/react": tarballs.react,
    "@peakui/styles": tarballs.styles,
  };

  for (const [name, tarball] of Object.entries(packed)) {
    if (name in dependencies) dependencies[name] = `file:./vendor/${basename(tarball)}`;
  }

  return {...manifest, dependencies};
}

const PEER_PACKAGES = [
  "react-aria-components",
  "@react-aria/utils",
  "react",
  "react-dom",
  "tailwindcss",
];

/** Versions read from the installed `node_modules`; null for a package that is not there. */
export function installedVersions(dir: string, names: string[]): Record<string, string | null> {
  const found: Record<string, string | null> = {};

  for (const name of names) {
    try {
      const manifest = JSON.parse(
        readFileSync(join(dir, "node_modules", name, "package.json"), "utf8"),
      ) as {version?: unknown};

      found[name] = typeof manifest.version === "string" ? manifest.version : null;
    } catch {
      found[name] = null;
    }
  }

  return found;
}

const SIDECAR_NOTE =
  "CSS comments are stripped in the staged copy of @peakui/styles, while the source package ships them. JavaScript and declaration comments are kept as built; commentInventory counts them.";

function sidecarPath(fixture: FixtureDefinition): string {
  return join(templatesDir(), `${fixture.id}.json`);
}

function readSidecar(fixture: FixtureDefinition): unknown {
  try {
    return JSON.parse(readFileSync(sidecarPath(fixture), "utf8"));
  } catch {
    return undefined;
  }
}

async function fail(argv: string[], stderr: string): Promise<never> {
  throw new Error(`${argv.join(" ")} failed: ${stderr}`);
}

export async function prepareTemplate(
  fixture: FixtureDefinition,
  pack: PackResult,
  options: {force: boolean},
): Promise<TemplateInfo> {
  const dir = join(templatesDir(), fixture.id);
  const hash = fixtureHash(fixture);
  const info: TemplateInfo = {
    dir,
    fixture: fixture.id,
    fixtureHash: hash,
    libraryHash: pack.libraryHash,
    reused: true,
  };

  if (
    !options.force &&
    existsSync(dir) &&
    templateIsCurrent(readSidecar(fixture), hash, pack.libraryHash)
  ) {
    return info;
  }

  rmSync(dir, {force: true, recursive: true});
  rmSync(sidecarPath(fixture), {force: true});
  mkdirSync(templatesDir(), {recursive: true});
  copyDir(fixture.dir, dir);

  const manifestPath = join(dir, "package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as PackageManifest;
  const dependencies = (manifest.dependencies ?? {}) as Record<string, string>;
  const needed = [
    ["@acme/status", pack.tarballs.acmeStatus],
    ["@peakui/react", pack.tarballs.react],
    ["@peakui/styles", pack.tarballs.styles],
  ] as const;

  mkdirSync(join(dir, "vendor"), {recursive: true});

  for (const [name, tarball] of needed) {
    if (name in dependencies) copyFileSync(tarball, join(dir, "vendor", basename(tarball)));
  }

  writeFileSync(
    manifestPath,
    `${JSON.stringify(withTarballDependencies(manifest, pack.tarballs), null, 2)}\n`,
  );

  const install = ["npm", "install", "--no-audit", "--no-fund"];
  const installed = await runCommand(install, {
    cwd: dir,
    env: npmEnvironment(),
    timeoutMs: 600_000,
  });

  if (installed.exitCode !== 0) await fail(install, installed.stderr || installed.stdout);

  for (const command of fixture.prepare) {
    const result = await runCommand(command, {cwd: dir, timeoutMs: 600_000});

    if (result.exitCode !== 0) await fail(command, result.stderr || result.stdout);
  }

  const npm = await runCommand(["npm", "--version"], {
    cwd: dir,
    env: npmEnvironment(),
    timeoutMs: 30_000,
  });

  writeFileSync(
    sidecarPath(fixture),
    `${JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        fixture: fixture.id,
        fixtureHash: hash,
        libraryHash: pack.libraryHash,
        commentInventory: pack.commentInventory,
        node: process.version,
        note: SIDECAR_NOTE,
        npm: npm.stdout.trim(),
        peers: installedVersions(dir, PEER_PACKAGES),
      },
      null,
      2,
    )}\n`,
  );

  return {...info, reused: false};
}

export function readTemplate(fixture: FixtureDefinition): TemplateInfo | undefined {
  const dir = join(templatesDir(), fixture.id);
  const sidecar = readSidecar(fixture);

  if (!existsSync(dir) || typeof sidecar !== "object" || sidecar === null) return undefined;

  const record = sidecar as Record<string, unknown>;

  return {
    dir,
    fixture: fixture.id,
    fixtureHash: String(record.fixtureHash),
    libraryHash: String(record.libraryHash),
    reused: true,
  };
}
