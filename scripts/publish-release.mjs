import {spawnSync} from "node:child_process";

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

  return lines.slice(start + 1, end === -1 ? undefined : end).join("\n").trim();
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

function main() {
  throw new Error("not implemented yet");
}

if (process.argv[1]?.endsWith("publish-release.mjs")) {
  main();
}
