import {spawnSync} from "node:child_process";
import {mkdtempSync, readdirSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

/*
 * attw --pack tars with npm, and npm does not apply pnpm's publishConfig overrides — the
 * tarball would keep the dev exports (src/*.ts) while `files` no longer ships src, and every
 * entrypoint would fail to resolve. Pack with pnpm instead (it applies publishConfig) and
 * point attw at the resulting tarball, so the gate checks the published shape.
 */

const dir = mkdtempSync(join(tmpdir(), "attw-"));
const pack = spawnSync("pnpm", ["pack", "--pack-destination", dir], {encoding: "utf8"});

if (pack.status !== 0) {
  console.error(pack.stdout, pack.stderr);

  process.exit(1);
}

const tarball = readdirSync(dir).find((file) => file.endsWith(".tgz"));

if (!tarball) {
  console.error("pnpm pack produced no tarball");

  process.exit(1);
}

const attw = spawnSync("pnpm", ["exec", "attw", join(dir, tarball), "--profile", "esm-only"], {
  stdio: "inherit",
});

process.exit(attw.status ?? 1);
