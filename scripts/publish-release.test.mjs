import {strict as assert} from "node:assert";
import {test} from "node:test";

import {
  extractChangelogSection,
  lockstepError,
  pendingChangesets,
  releaseNotes,
  tarballName,
} from "./publish-release.mjs";

test("pendingChangesets ignores the README and non-markdown files", () => {
  assert.equal(pendingChangesets(["README.md", "config.json"]), false);
  assert.equal(pendingChangesets(["README.md", "config.json", "brave-pandas-run.md"]), true);
});

test("tarballName flattens the scope the way npm does", () => {
  assert.equal(tarballName("@peakui/react", "0.0.1"), "peakui-react-0.0.1.tgz");
});

test("extractChangelogSection returns the section body for the version", () => {
  const md = "# @peakui/react\n\n## 0.0.2\n\nsecond\n\n## 0.0.1\n\nfirst\n- item\n";

  assert.equal(extractChangelogSection(md, "0.0.1"), "first\n- item");
  assert.equal(extractChangelogSection(md, "0.0.2"), "second");
  assert.equal(extractChangelogSection(md, "9.9.9"), null);
});

test("releaseNotes keeps only packages that have a section", () => {
  const notes = releaseNotes({"@peakui/react": "react changes", "@peakui/styles": null});

  assert.equal(notes, "## @peakui/react\n\nreact changes");
});

test("lockstepError passes on matching versions and reports drift", () => {
  assert.equal(lockstepError({"@peakui/react": "0.0.1", "@peakui/styles": "0.0.1"}), null);
  assert.match(
    String(lockstepError({"@peakui/react": "0.0.2", "@peakui/styles": "0.0.1"})),
    /lockstep/,
  );
});
