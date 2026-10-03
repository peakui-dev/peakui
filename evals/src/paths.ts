import {tmpdir} from "node:os";
import {join} from "node:path";

export const PACKAGE_DIR = join(import.meta.dirname, "..");
export const REPO_DIR = join(PACKAGE_DIR, "..");
export const RESULTS_DIR = join(PACKAGE_DIR, "results");

export function evalsHome(): string {
  const home = process.env.PEAKUI_EVALS_HOME;

  return home ? home : join(tmpdir(), "peakui-evals");
}

export function tarballsDir(): string {
  return join(evalsHome(), "tarballs");
}

export function templatesDir(): string {
  return join(evalsHome(), "templates");
}

export function workspacesDir(): string {
  return join(evalsHome(), "workspaces");
}

export function agentConfigDir(batch: string): string {
  return join(evalsHome(), "agent-config", batch);
}
