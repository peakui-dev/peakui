/*
 * Bootstrap for a fresh clone, and the diagnostic behind `pnpm bootstrap --check`.
 *
 * The functions here are pure so they can be tested without touching the disk or the
 * network; the side-effecting parts live behind the entry point at the bottom.
 */

import {connect} from "node:net";

/** Parses "v24.21.0" or "24.21" into numbers. Missing segments count as zero. */
function parseVersion(raw) {
  return String(raw)
    .trim()
    .replace(/^v/, "")
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);
}

/*
 * Segment-by-segment, never lexically: as strings "22.9" sorts after "22.18", which would
 * let a node below the floor pass.
 */
function compareVersions(a, b) {
  const left = parseVersion(a);
  const right = parseVersion(b);
  const length = Math.max(left.length, right.length);

  for (let i = 0; i < length; i += 1) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);

    if (diff !== 0) return diff;
  }

  return 0;
}

export function checkNodeVersion(actual, floor) {
  const ok = compareVersions(actual, floor) >= 0;

  return {
    name: "node",
    ok,
    detail: ok ? `${actual} (floor ${floor})` : `${actual} is below the required ${floor}`,
  };
}

export function checkPnpmVersion(actual, required) {
  const ok = compareVersions(actual, required) === 0;

  return {
    name: "pnpm",
    ok,
    detail: ok ? `${actual}` : `${actual} does not match the required ${required}`,
  };
}

/** Renders the findings and decides the exit code: any failure makes it non-zero. */
export function formatReport(findings) {
  const lines = findings.map(
    ({name, ok, detail}) => `${ok ? "ok  " : "FAIL"}  ${name}: ${detail}`,
  );
  const failed = findings.filter((finding) => !finding.ok);

  if (failed.length > 0) {
    lines.push("", `${failed.length} check(s) failed. See .agents/rules/onboarding.md.`);
  }

  return {text: lines.join("\n"), code: failed.length > 0 ? 1 : 0};
}

/** True when something already listens on the port. Used to report, not to fail. */
export function isPortBusy(port) {
  return new Promise((resolve) => {
    const socket = connect({host: "127.0.0.1", port});

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
  });
}
