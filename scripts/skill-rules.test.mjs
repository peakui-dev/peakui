import {strict as assert} from "node:assert";
import {readFileSync} from "node:fs";
import {test} from "node:test";

/*
 * Гейт на три правила стандарта, приведённые к фактическому поведению эталона
 * (docs/superpowers/specs/2026-10-02-react-package-button-design.md, раздел 2). Проверяется
 * наличие исправленного текста, а не его пересказ: описать правило дважды — значит развести
 * две копии.
 */

const read = (path) => readFileSync(path, "utf8");

const A11Y = ".agents/skills/peakui-component-standards/references/accessibility-and-i18n.md";
const TS = ".agents/skills/peakui-component-standards/references/typescript.md";
const SKILL = ".agents/skills/peakui-component-standards/SKILL.md";

test("a hardcoded English default is no longer called a defect", () => {
  const text = read(A11Y);

  assert.ok(
    !text.includes("Hardcoded Russian or English in JSX is a defect"),
    `${A11Y}: всё ещё называет зашитую строку дефектом`,
  );
  assert.ok(
    /hardcoded English default is acceptable/i.test(text),
    `${A11Y}: нет разрешения на английский дефолт`,
  );
  assert.ok(
    /consumer-supplied label always wins/i.test(text),
    `${A11Y}: потеряно правило о приоритете метки потребителя`,
  );
});

test("the any relaxation is scoped to the polymorphic spread boundary", () => {
  for (const path of [TS, SKILL]) {
    const text = read(path);

    assert.ok(/DOMRenderProps/.test(text), `${path}: исключение не привязано к DOMRenderProps`);
    assert.ok(
      /polymorphic spread/i.test(text),
      `${path}: исключение не ограничено полиморфным spread'ом`,
    );
  }
});

test("tests are located under tests/, stories beside the component", () => {
  const text = read(SKILL);

  assert.ok(
    /tests\/components\/<component-name>\//.test(text),
    `${SKILL}: тесты не перенесены в tests/`,
  );
  assert.ok(
    !text.includes("<component-name>.test.tsx # jsdom"),
    `${SKILL}: старое расположение тестов осталось`,
  );
});

test("AGENTS.md and CLAUDE.md stay byte-identical", () => {
  assert.ok(read("AGENTS.md") === read("CLAUDE.md"), "AGENTS.md и CLAUDE.md разошлись");
});
