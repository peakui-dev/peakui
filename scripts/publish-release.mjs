import {spawnSync} from "node:child_process";
import {mkdirSync, readFileSync, readdirSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

/*
 * Release publisher. Runs in CI (release.yml) on every push to main:
 *  - pending changesets -> the changesets action only tends the Version Packages PR;
 *  - versions bumped and no v<version> tag yet -> pack, npm publish, tag, GitHub Release.
 * `--dry-run` rehearses everything except the upload and the tag/release creation.
 */

export const PACKAGES = [
  {name: "@peakui/react", dir: "packages/react"},
  {name: "@peakui/styles", dir: "packages/styles"},
];

export function pendingChangesets(filenames) {
  return filenames.some((file) => file.endsWith(".md") && file !== "README.md");
}

export function tarballName(pkgName, version) {
  return `${pkgName.replace(/^@/, "").replace("/", "-")}-${version}.tgz`;
}

export function extractChangelogSection(markdown, version) {
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) => line === `## ${version}`);

  if (start === -1) {
    return null;
  }

  const end = lines.findIndex((line, index) => index > start && line.startsWith("## "));

  return lines
    .slice(start + 1, end === -1 ? undefined : end)
    .join("\n")
    .trim();
}

export function releaseNotes(sections) {
  return Object.entries(sections)
    .filter(([, body]) => body !== null)
    .map(([pkg, body]) => `## ${pkg}\n\n${body}`)
    .join("\n\n");
}

export function lockstepError(versions) {
  if (new Set(Object.values(versions)).size > 1) {
    return new Error(`lockstep violated: ${JSON.stringify(versions)} — fix before publishing`);
  }

  return null;
}

export function run(command, args) {
  const result = spawnSync(command, args, {encoding: "utf8", stdio: "inherit"});

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with ${result.status}`);
  }
}

function tagExists(tag) {
  return spawnSync("git", ["tag", "-l", tag], {encoding: "utf8"}).stdout.trim() !== "";
}

function main() {
  const dryRun = process.argv.includes("--dry-run");

  if (pendingChangesets(readdirSync(".changeset"))) {
    console.log(
      "pending changesets — the Version Packages PR is being maintained, nothing to publish",
    );

    return;
  }

  const manifests = PACKAGES.map((pkg) => ({
    ...pkg,
    version: JSON.parse(readFileSync(join(pkg.dir, "package.json"), "utf8")).version,
  }));
  const versions = Object.fromEntries(manifests.map((pkg) => [pkg.name, pkg.version]));
  const error = lockstepError(versions);

  if (error) {
    throw error;
  }

  const version = manifests[0].version;
  const tag = `v${version}`;

  if (version === "0.0.0") {
    console.log("0.0.0 is the pre-release placeholder — publish only after a Version Packages PR");

    return;
  }

  if (tagExists(tag)) {
    console.log(`${tag} already exists — nothing to publish`);

    return;
  }

  const packDir = join(tmpdir(), "peakui-release");

  mkdirSync(packDir, {recursive: true});

  for (const {name} of manifests) {
    run("pnpm", ["--filter", name, "pack", "--pack-destination", packDir]);
    run("npm", [
      "publish",
      join(packDir, tarballName(name, version)),
      "--access",
      "public",
      ...(dryRun ? ["--dry-run"] : ["--provenance"]),
    ]);
  }

  if (dryRun) {
    console.log(`dry run — ${tag} would now be tagged and the GitHub Release created`);

    return;
  }

  run("git", ["tag", tag]);
  run("git", ["push", "origin", tag]);

  const sections = Object.fromEntries(
    manifests.map(({dir, name}) => [
      name,
      extractChangelogSection(readFileSync(join(dir, "CHANGELOG.md"), "utf8"), version),
    ]),
  );

  run("gh", ["release", "create", tag, "--title", tag, "--notes", releaseNotes(sections)]);
}

if (process.argv[1]?.endsWith("publish-release.mjs")) {
  main();
}
