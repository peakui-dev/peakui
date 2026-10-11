import {strict as assert} from "node:assert";
import {execFileSync} from "node:child_process";
import {existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync} from "node:fs";
import {createRequire} from "node:module";
import {basename, dirname, join, resolve} from "node:path";
import {test} from "node:test";

import {DEFAULT_ORIGIN, SKILL_VERSION} from "../../skills/peakui-react/scripts/lib.mjs";

/*
 * Gates on the consumer skill in skills/peakui-react. The whole directory is copied into a
 * consumer's project, so it must be a valid Agent Skill, every example in it must compile against
 * the library as it is today, and nothing in it may point back into this repository.
 */

const SKILL_DIR = "skills/peakui-react";
const SPEC_FIELDS = ["name", "description", "license", "compatibility", "metadata"];
const SECTIONS = [
  "## Workflow",
  "## Rules the type-checker will not catch",
  "## What to read for the task",
  "## When the docs cannot be reached",
];
// The reference library, process documents and paths that exist only inside this monorepo.
const INTERNAL =
  /hero\s?ui|superpowers|peakui-company|codegraph|\.agents\/|packages\/(?:react|styles)\/src|apps\/docs/i;
const NON_LATIN = /[Ѐ-ӿ]/;
const DOCS_CONTENT = "apps/docs/content/docs/en/react";
const SNIPPET_DIR = "apps/docs/node_modules/.cache/skill-snippets";

const read = (path) => readFileSync(path, "utf8");

function walk(directory) {
  return readdirSync(directory, {withFileTypes: true}).flatMap((entry) =>
    entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)],
  );
}

/** `SKILL.md` and every reference: the prose a consumer's agent reads. */
function skillTexts() {
  const references = join(SKILL_DIR, "references");
  const files = existsSync(references)
    ? walk(references).filter((path) => path.endsWith(".md"))
    : [];

  return [join(SKILL_DIR, "SKILL.md"), ...files].map((path) => ({path, text: read(path)}));
}

/** The frontmatter as a flat map; a nested map is one level of two-space indentation. */
function frontmatter(text) {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);

  assert.ok(match, "SKILL.md opens with a frontmatter block");

  const fields = {};
  let parent;

  for (const line of match[1].split("\n")) {
    const nested = /^ {2}([\w-]+):\s*(.*)$/.exec(line);
    const top = /^([\w-]+):\s*(.*)$/.exec(line);

    if (nested && parent) {
      fields[parent][nested[1]] = JSON.parse(nested[2]);
    } else if (top) {
      parent = top[2] === "" ? top[1] : undefined;
      fields[top[1]] = top[2] === "" ? {} : top[2];
    } else {
      assert.fail(`unreadable frontmatter line: ${JSON.stringify(line)}`);
    }
  }

  return {body: text.slice(match[0].length), fields};
}

function fences(text, language) {
  return [...text.matchAll(new RegExp("```" + language + "\\n([\\s\\S]*?)```", "g"))].map(
    (match) => match[1],
  );
}

function relativeLinks(text) {
  return [...text.matchAll(/\]\(([^)\s]+)\)/g)]
    .map((match) => match[1].split("#")[0])
    .filter((target) => target !== "" && !/^[a-z]+:/i.test(target));
}

/** Type-checks each snippet as its own module against the workspace packages. */
export function typecheckSnippets(snippets) {
  rmSync(SNIPPET_DIR, {force: true, recursive: true});
  mkdirSync(SNIPPET_DIR, {recursive: true});

  const files = snippets.map(({code, name}) => {
    writeFileSync(join(SNIPPET_DIR, `${name}.tsx`), code);

    return `${name}.tsx`;
  });

  writeFileSync(
    join(SNIPPET_DIR, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {incremental: false, noEmit: true, plugins: []},
      exclude: [],
      extends: "../../../tsconfig.json",
      files,
      include: [],
    }),
  );

  try {
    execFileSync(
      "pnpm",
      ["--filter", "@peakui/docs", "exec", "tsc", "-p", "node_modules/.cache/skill-snippets"],
      {encoding: "utf8", stdio: "pipe"},
    );

    return {ok: true, output: ""};
  } catch (error) {
    return {ok: false, output: `${error.stdout ?? ""}${error.stderr ?? ""}`};
  }
}

/** What a `css` example may import: Tailwind, and the specifiers `@peakui/styles` exports. */
export function cssProblems(css) {
  const postcss = createRequire(resolve("evals/package.json"))("postcss");
  const exported = Object.keys(JSON.parse(read("packages/styles/package.json")).exports).map(
    (key) =>
      new RegExp(
        `^${`@peakui/styles${key.slice(1)}`.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".+")}$`,
      ),
  );
  let root;

  try {
    root = postcss.parse(css);
  } catch (error) {
    return [`does not parse: ${error.message}`];
  }

  const problems = [];

  root.walkAtRules("import", (rule) => {
    const specifier = /^(?:url\(\s*)?["']?([^"')\s]+)/.exec(rule.params)?.[1] ?? "";
    const known =
      specifier === "tailwindcss" ||
      (specifier !== "@peakui/styles" && exported.some((pattern) => pattern.test(specifier)));

    if (!known) problems.push(`imports ${specifier}, which @peakui/styles does not export`);
  });

  return problems;
}

test("frontmatter holds only specification fields", () => {
  const {fields} = frontmatter(read(join(SKILL_DIR, "SKILL.md")));

  assert.deepEqual(
    Object.keys(fields).filter((key) => !SPEC_FIELDS.includes(key)),
    [],
  );
  assert.equal(fields.name, basename(SKILL_DIR));
  assert.ok(fields.description.length >= 1 && fields.description.length <= 1024);
  assert.equal(typeof fields.metadata.version, "string");
  assert.equal(fields.metadata.version, SKILL_VERSION);
});

test("description is third person and names both packages", () => {
  const {description} = frontmatter(read(join(SKILL_DIR, "SKILL.md"))).fields;

  assert.ok(description.includes("@peakui/react"));
  assert.ok(description.includes("@peakui/styles"));
  assert.doesNotMatch(description, /\b(?:I|you|your)\b/i);
});

test("the body is under 500 lines and has the four sections in order", () => {
  const {body} = frontmatter(read(join(SKILL_DIR, "SKILL.md")));
  const positions = SECTIONS.map((heading) => body.split("\n").indexOf(heading));

  assert.ok(body.split("\n").length < 500);
  assert.ok(
    positions.every((position) => position !== -1),
    `every section heading is present: ${SECTIONS.join(", ")}`,
  );
  assert.deepEqual(
    positions,
    [...positions].sort((a, b) => a - b),
  );
});

test("links resolve one level deep", () => {
  const texts = skillTexts();
  const fromSkill = relativeLinks(texts[0].text);

  for (const target of fromSkill) {
    assert.ok(existsSync(join(SKILL_DIR, target)), `SKILL.md links to ${target}, which is missing`);
  }

  for (const {path, text} of texts.slice(1)) {
    const name = path.slice(SKILL_DIR.length + 1);

    assert.ok(fromSkill.includes(name), `${name} is not linked from SKILL.md`);
    assert.deepEqual(
      relativeLinks(text).filter((target) => target.endsWith(".md")),
      [],
      `${name} links to another reference; every reference is reached from SKILL.md`,
    );
  }
});

test("a reference longer than 100 lines opens with a table of contents", () => {
  for (const {path, text} of skillTexts().slice(1)) {
    const lines = text.split("\n");

    if (lines.length > 100) {
      assert.ok(lines.slice(0, 15).includes("## Contents"), `${path} needs a ## Contents section`);
    }
  }
});

test("scripts are invoked through node", () => {
  for (const {path, text} of skillTexts()) {
    for (const match of text.matchAll(/(.{0,5})scripts\/[\w-]+\.mjs/g)) {
      assert.ok(match[1].endsWith("node "), `${path}: "${match[0]}" is not run through node`);
    }
  }
});

test("pages named in the routing table exist in the documentation", () => {
  const {body} = frontmatter(read(join(SKILL_DIR, "SKILL.md")));
  const section = body.slice(body.indexOf(SECTIONS[2]), body.indexOf(SECTIONS[3]));
  const rows = section.split("\n").filter((line) => line.startsWith("|"));
  const pages = new Set(
    walk(DOCS_CONTENT)
      .filter((path) => path.endsWith(".mdx"))
      .map((path) =>
        basename(path) === "index.mdx" ? basename(dirname(path)) : basename(path, ".mdx"),
      ),
  );

  assert.ok(rows.length > 2, "the section holds a table");

  for (const row of rows.slice(2)) {
    const cell = row.split("|").at(-2);

    for (const name of cell.match(/[a-z][a-z0-9-]*/g) ?? []) {
      assert.ok(
        pages.has(name),
        `the routing table names the page "${name}", which does not exist`,
      );
    }
  }
});

test("the default origin is the public site", () => {
  assert.equal(DEFAULT_ORIGIN, "https://peakui.dev");
});

test("no internal traces", () => {
  for (const path of walk(SKILL_DIR)) {
    const text = read(path);

    assert.doesNotMatch(text, INTERNAL, `${path} names something internal to this repository`);
    assert.doesNotMatch(text, NON_LATIN, `${path} holds non-Latin text`);
  }
});

test("the compile check tells a correct example from a wrong one", () => {
  const good = `import {Button} from "@peakui/react";\n\nexport const Save = () => <Button onPress={() => {}}>Save</Button>;\n`;
  const bad = `import {Button} from "@peakui/react";\n\nexport const Save = () => <Button isLoading>Save</Button>;\n`;

  assert.equal(typecheckSnippets([{code: good, name: "good"}]).ok, true);

  const result = typecheckSnippets([{code: bad, name: "bad"}]);

  assert.equal(result.ok, false);
  assert.match(result.output, /bad\.tsx.*isLoading/s);
});

test("every tsx block type-checks", () => {
  const snippets = skillTexts().flatMap(({path, text}) =>
    fences(text, "tsx").map((code, index) => ({
      code,
      name: `${basename(path, ".md")}-${index + 1}`,
    })),
  );

  if (snippets.length === 0) return;

  const result = typecheckSnippets(snippets);

  assert.ok(result.ok, `an example in the skill does not compile:\n${result.output}`);
});

test("the css check tells an exported stylesheet from an invented one", () => {
  assert.deepEqual(cssProblems('@import "tailwindcss";\n@import "@peakui/styles/css";\n'), []);
  assert.deepEqual(cssProblems('@source "../node_modules/some-package";\n'), []);
  assert.equal(cssProblems('@import "@peakui/styles/everything";\n').length, 1);
  // The bare package name is not a dependable way to reach the stylesheet; an example uses /css.
  assert.equal(cssProblems('@import "@peakui/styles";\n').length, 1);
  assert.equal(cssProblems(".a { color: red;").length, 1);
});

test("every css block parses and imports only exported specifiers", () => {
  for (const {path, text} of skillTexts()) {
    for (const css of fences(text, "css")) {
      assert.deepEqual(cssProblems(css), [], `${path}: a css example is wrong`);
    }
  }
});

test("contributor skills are hidden from the skill installer", () => {
  // `npx skills add <repository>` offers every SKILL.md it finds. The skills under .agents/ are
  // for people working on the library; `metadata.internal: true` keeps them out of that list.
  const contributor = walk(".agents/skills").filter((path) => basename(path) === "SKILL.md");

  assert.ok(contributor.length > 0, "the repository has contributor skills");

  for (const path of contributor) {
    const block = /^---\n([\s\S]*?)\n---\n/.exec(read(path))?.[1] ?? "";

    assert.match(
      block,
      /^metadata:\n(?: {2}.*\n)*? {2}internal: true$/m,
      `${path} is not internal`,
    );
  }
});

test("the install page installs this skill only", () => {
  const page = read(`${DOCS_CONTENT}/getting-started/(ui-for-agents)/agent-skills.mdx`);

  assert.match(page, /npx skills add peakui-dev\/peakui --skill peakui-react/);
});
