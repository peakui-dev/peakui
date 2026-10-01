# Design Tokens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@peakui/styles` — a token generator that turns a ~6-field preset into a verified, two-scheme semantic token set, plus the stable `@theme inline` surface every component consumes.

**Architecture:** A preset (data) feeds a pure-TypeScript pipeline: parse → derive scheme sets → derive calculated tokens → verify contrast → emit CSS. The emitted `themes/<id>/variables.css` is committed. The `@theme inline` mapping in `themes/shared/theme.css` is hand-authored and stable, so adding a theme can never change the public Tailwind surface.

**Tech Stack:** TypeScript 5.9, Node 24, pnpm 12, Tailwind CSS v4, `tailwind-variants`, vitest. No colour library — the OKLab maths is ~40 lines and a dependency here would be a liability.

**Spec:** `docs/superpowers/specs/2026-10-01-design-tokens-design.md`

## Global Constraints

- Node ≥ 22, pnpm 12, TypeScript 5.9, Tailwind CSS ≥ 4.0 as a peer.
- Token names follow HeroUI v3 **1:1**; values are ours. The vendored read-only reference is `heroui/` (never edited).
- No `any`. Named exports only. `import type` for types.
- Colours declared in `oklch`, mixed `in oklab`.
- Every emitted colour token is `oklch(...)` or `oklch(... / A)` — never hex, never `rgb()`.
- `sideEffects: false` on every package.
- Contrast floors: **4.5:1** text pairs, **3:1** boundary tokens (`border`, `separator`, `focus`).
- Lightness search: step 0.01 L, max 40 iterations, chroma and hue unchanged, every adjustment reported.
- Agent-facing docs in English; specs, plans and user-facing text in Russian.

## Deferred — not in this plan

The spec's §5 names a theme-switching hook (`class` + `data-theme` on `<html>`, `localStorage`,
`"system"`). It belongs to `@peakui/react`, which does not exist yet, so it is **not** a task here.
This plan delivers the CSS contract the hook will drive: theme selectors, `color-scheme`, and the
resolved `<id>-<scheme>` naming. The hook lands with the React package and must consume that naming.

Pro theme authoring (the spec's §4) is likewise only mechanically enabled here — the `./generator`
export, the `./themes/*/*.css` glob, and the per-theme `components/index.css` hook. The namespacing
rule for a theme's own tokens cannot be enforced from core and stays a review rule.

## Review Focus

Five conditions the spec implies that no task's happy path exercises. Each has its test pinned to the task that owns the code.

1. **Out-of-gamut OKLCH** — a high-chroma accent converts to linear sRGB components outside [0,1]; unclamped, relative luminance goes negative or above 1 and every ratio built on it is wrong. Clamp before luminance. (Task 2)
2. **Achromatic hue `none`** — CSS permits `oklch(0.5 0 none)`; a parser doing `parseFloat("none")` yields `NaN` and poisons the whole pipeline silently. Treat as hue 0. (Task 2)
3. **Mix percentages not summing to 100** — the spec's `field-hover` is `mix(field-bg 90, field-fg 2)`. CSS normalises; a naive `lerp(a, b, p/100)` does not, and the emitted colour will not match what the same declaration would produce in a browser. (Task 4)
4. **A translucent token measured without compositing** — `accent-soft` is alpha 0.15, so checking `accent-soft-foreground` against it directly reports a ratio no user ever sees. Composite over the scheme background first. (Task 3)
5. **A token referenced but never declared** — a component writing `var(--color-muted-foreground)` when the set has only `--muted` resolves to nothing and the element renders unstyled, with no error anywhere. (Task 9)

---

### Task 1: Workspace and `@peakui/styles` skeleton

**Files:**
- Create: `pnpm-workspace.yaml`, `package.json`, `tsconfig.base.json`
- Create: `packages/styles/package.json`, `packages/styles/tsconfig.json`, `packages/styles/vitest.config.ts`
- Test: `packages/styles/src/index.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: the `@peakui/styles` workspace package; `pnpm test` runs vitest in it.

- [ ] **Step 1: Write the failing test**

```ts
// packages/styles/src/index.test.ts
import {describe, expect, it} from "vitest";
import {version} from "./index";

describe("@peakui/styles", () => {
  it("экспортирует версию пакета", () => {
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @peakui/styles exec vitest run`
Expected: FAIL — cannot resolve `./index`.

- [ ] **Step 3: Create the workspace**

`pnpm-workspace.yaml` lists `packages/*` and `apps/*`. Root `package.json` is private, declares `packageManager: "pnpm@12.3.4"`, and a `test` script delegating to the workspace. `packages/styles/package.json`: name `@peakui/styles`, `version 0.0.0`, `private: false`, `sideEffects: false`, `peerDependencies: {tailwindcss: ">=4.0.0"}`, `dependencies: {tailwind-variants: "^3.3.1"}`, devDeps `vitest` and `typescript`. Export `const version` from `packages/styles/src/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @peakui/styles exec vitest run`
Expected: PASS, 1 test.

- [ ] **Step 5: Commit**

```bash
git add pnpm-workspace.yaml package.json tsconfig.base.json packages/styles
git commit -m "chore(styles): каркас workspace и пакета @peakui/styles"
```

---

### Task 2: OKLCH colour maths

**Files:**
- Create: `packages/styles/src/generator/color.ts`
- Test: `packages/styles/src/generator/color.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type Oklch = {l: number; c: number; h: number; a: number}` — `a` defaults to 1
  - `parseOklch(value: string): Oklch | null`
  - `formatOklch(color: Oklch): string` — omits `/ A` when `a === 1`, rounds to 4 decimals
  - `oklchToLinearSrgb(color: Oklch): {r: number; g: number; b: number}` — clamped to [0,1]
  - `relativeLuminance(color: Oklch): number`
  - `contrastRatio(a: Oklch, b: Oklch): number`

- [ ] **Step 1: Write the failing tests**

```ts
describe("color", () => {
  describe("parseOklch", () => {
    it("разбирает проценты и десятичную светлоту одинаково", () => {
      expect(parseOklch("oklch(62% 0.195 253.83)")?.l).toBeCloseTo(0.62, 4);
      expect(parseOklch("oklch(0.62 0.195 253.83)")?.l).toBeCloseTo(0.62, 4);
    });
    it("трактует hue none как 0", () => {
      expect(parseOklch("oklch(0.5 0 none)")?.h).toBe(0);
    });
    it("разбирает альфу", () => {
      expect(parseOklch("oklch(0.5 0.1 200 / 0.15)")?.a).toBeCloseTo(0.15, 4);
    });
    it("возвращает null на мусоре", () => {
      expect(parseOklch("rebeccapurple")).toBeNull();
    });
  });

  describe("relativeLuminance", () => {
    it("белый = 1, чёрный = 0", () => {
      expect(relativeLuminance({l: 1, c: 0, h: 0, a: 1})).toBeCloseTo(1, 3);
      expect(relativeLuminance({l: 0, c: 0, h: 0, a: 1})).toBeCloseTo(0, 3);
    });
    it("не выходит из [0,1] на цвете вне гаммы", () => {
      const lum = relativeLuminance({l: 0.7, c: 0.4, h: 150, a: 1});
      expect(lum).toBeGreaterThanOrEqual(0);
      expect(lum).toBeLessThanOrEqual(1);
    });
  });

  describe("contrastRatio", () => {
    const white = {l: 1, c: 0, h: 0, a: 1};
    const black = {l: 0, c: 0, h: 0, a: 1};
    it("белый на чёрном = 21:1", () => {
      expect(contrastRatio(white, black)).toBeCloseTo(21, 1);
    });
    it("симметричен", () => {
      expect(contrastRatio(white, black)).toBeCloseTo(contrastRatio(black, white), 6);
    });
    it("цвет с самим собой = 1", () => {
      expect(contrastRatio(white, white)).toBeCloseTo(1, 6);
    });
  });

  describe("formatOklch", () => {
    it("опускает альфу когда она 1", () => {
      expect(formatOklch({l: 0.5, c: 0.1, h: 200, a: 1})).toBe("oklch(0.5 0.1 200)");
    });
    it("печатает альфу когда она меньше 1", () => {
      expect(formatOklch({l: 0.5, c: 0.1, h: 200, a: 0.15})).toBe("oklch(0.5 0.1 200 / 0.15)");
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @peakui/styles exec vitest run color`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `color.ts`**

The OKLab→linear-sRGB conversion is not derivable from the signature, so use exactly these constants (Ottosson):

```ts
// oklch → oklab
const a_ = c * Math.cos((h * Math.PI) / 180);
const b_ = c * Math.sin((h * Math.PI) / 180);
// oklab → linear srgb
const L = l + 0.3963377774 * a_ + 0.2158037573 * b_;
const M = l - 0.1055613458 * a_ - 0.0638541728 * b_;
const S = l - 0.0894841775 * a_ - 1.2914855480 * b_;
const l3 = L ** 3, m3 = M ** 3, s3 = S ** 3;
const r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
const b = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;
```

Clamp each channel to [0,1] **before** luminance. These are already linear, so apply the WCAG weights directly: `0.2126 r + 0.7152 g + 0.0722 b` — do not gamma-encode and re-linearise. Ratio is `(hi + 0.05) / (lo + 0.05)`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @peakui/styles exec vitest run color`
Expected: PASS, 10 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/styles/src/generator/color.ts packages/styles/src/generator/color.test.ts
git commit -m "feat(styles): цветовая математика OKLCH и контраст по WCAG"
```

---

### Task 3: Mixing, compositing and the contrast guarantee

**Files:**
- Create: `packages/styles/src/generator/contrast.ts`
- Test: `packages/styles/src/generator/contrast.test.ts`

**Interfaces:**
- Consumes: Task 2's `Oklch`, `contrastRatio`, `relativeLuminance`.
- Produces:
  - `mix(a: Oklch, pa: number, b: Oklch, pb: number): Oklch` — normalises when `pa + pb !== 100`
  - `TRANSPARENT: Oklch` — `{l: 0, c: 0, h: 0, a: 0}`
  - `compositeOver(fg: Oklch, bg: Oklch): Oklch` — alpha composite, result `a = 1`
  - `type ContrastFix = {token: string; from: number; to: number; ratio: number}`
  - `ensureContrast(args: {token: string; fg: Oklch; bg: Oklch; min: number}): {color: Oklch; fix?: ContrastFix}` — throws when the search fails

- [ ] **Step 1: Write the failing tests**

```ts
describe("mix", () => {
  it("нормализует проценты, не дающие 100", () => {
    // mix(X 90, Y 2) === mix(X 97.83, Y 2.17) после нормализации
    const a = {l: 1, c: 0, h: 0, a: 1}, b = {l: 0, c: 0, h: 0, a: 1};
    expect(mix(a, 90, b, 2).l).toBeCloseTo(mix(a, 97.826, b, 2.174).l, 3);
  });
  it("смешивание с transparent снижает альфу, не светлоту", () => {
    const accent = {l: 0.58, c: 0.2, h: 275, a: 1};
    const soft = mix(accent, 15, TRANSPARENT, 85);
    expect(soft.a).toBeCloseTo(0.15, 3);
    expect(soft.l).toBeCloseTo(0.58, 3);
  });
});

describe("compositeOver", () => {
  it("полупрозрачный чёрный на белом даёт серый с альфой 1", () => {
    const result = compositeOver({l: 0, c: 0, h: 0, a: 0.5}, {l: 1, c: 0, h: 0, a: 1});
    expect(result.a).toBe(1);
    expect(relativeLuminance(result)).toBeLessThan(1);
    expect(relativeLuminance(result)).toBeGreaterThan(0);
  });
});

describe("ensureContrast", () => {
  it("не трогает пару, которая уже проходит", () => {
    const {color, fix} = ensureContrast({
      token: "foreground", fg: {l: 0, c: 0, h: 0, a: 1}, bg: {l: 1, c: 0, h: 0, a: 1}, min: 4.5,
    });
    expect(fix).toBeUndefined();
    expect(color.l).toBe(0);
  });
  it("двигает светлоту до прохождения и отчитывается", () => {
    const {color, fix} = ensureContrast({
      token: "accent-foreground", fg: {l: 0.62, c: 0.02, h: 275, a: 1},
      bg: {l: 0.58, c: 0.2, h: 275, a: 1}, min: 4.5,
    });
    expect(fix).toBeDefined();
    expect(fix?.token).toBe("accent-foreground");
    expect(fix?.ratio).toBeGreaterThanOrEqual(4.5);
    expect(color.c).toBeCloseTo(0.02, 6);   // хрома не меняется
    expect(color.h).toBeCloseTo(275, 6);    // тон не меняется
  });
  it("бросает, когда 40 шагов не хватает", () => {
    expect(() => ensureContrast({
      token: "impossible", fg: {l: 0.5, c: 0, h: 0, a: 1}, bg: {l: 0.5, c: 0, h: 0, a: 1}, min: 21,
    })).toThrow(/impossible/);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @peakui/styles exec vitest run contrast`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `contrast.ts`**

`mix` normalises both weights by their sum, lerps `l`/`c`/`a` linearly and `h` along the shorter arc, operating in OKLab space per the spec. `ensureContrast` measures, and while the ratio is short, steps L by 0.01 **away from the background's luminance** (down if the background is light, up if dark), capped at 40 iterations and clamped to [0,1]; it throws naming the token and the best ratio reached. A translucent `bg` is composited over an opaque base by the caller, not here.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @peakui/styles exec vitest run contrast`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/styles/src/generator/contrast.ts packages/styles/src/generator/contrast.test.ts
git commit -m "feat(styles): смешивание, композитинг и гарантия контраста"
```

---

### Task 4: Preset types and token derivation

**Files:**
- Create: `packages/styles/src/generator/preset.ts` (types + `RADIUS_BASE`)
- Create: `packages/styles/src/generator/derive.ts`
- Test: `packages/styles/src/generator/derive.test.ts`

**Interfaces:**
- Consumes: Tasks 2–3.
- Produces:
  - `type ThemePreset`, `type RadiusId`, `type SemanticSet`, `RADIUS_BASE` — copied verbatim from the spec's §2
  - `type TokenSet = Record<string, string>` — token name without `--` → CSS value
  - `type Scheme = "light" | "dark"`
  - `deriveTheme(preset: ThemePreset): {invariant: TokenSet; light: TokenSet; dark: TokenSet; fixes: ContrastFix[]}`

- [ ] **Step 1: Write the failing tests**

```ts
const preset: ThemePreset = {
  id: "test", accent: "oklch(0.58 0.2 275)", grayChroma: 0.006,
  radius: "medium", formRadius: "large",
};

describe("deriveTheme", () => {
  it("объявляет полный набор в обеих схемах", () => {
    const {light, dark} = deriveTheme(preset);
    expect(Object.keys(light).sort()).toEqual(Object.keys(dark).sort());
    for (const name of ["background", "foreground", "surface", "overlay", "muted", "default",
                        "accent", "accent-foreground", "border", "separator", "focus", "backdrop"]) {
      expect(light[name], name).toBeDefined();
    }
  });
  it("выводит soft-токены как полупрозрачные", () => {
    const {light} = deriveTheme(preset);
    expect(light["accent-soft"]).toMatch(/\/ 0\.15\)$/);
  });
  it("нейтрали несут тон акцента", () => {
    const {light} = deriveTheme(preset);
    expect(parseOklch(light["muted"]!)?.h).toBeCloseTo(275, 0);
    expect(parseOklch(light["muted"]!)?.c).toBeLessThanOrEqual(0.03);
  });
  it("стеки гарнитур попадают в инварианты темы", () => {
    const {invariant} = deriveTheme({...preset,
      typography: {sans: ["Inter", "sans-serif"], mono: ["JetBrains Mono", "monospace"]}});
    expect(invariant["sans"]).toBe("Inter, sans-serif");
    expect(invariant["mono"]).toBe("JetBrains Mono, monospace");
  });
  it("без typography в пресете подставляет дефолтные стеки", () => {
    expect(deriveTheme(preset).invariant["sans"]).toMatch(/Inter/);
  });
  it("radius берётся из RADIUS_BASE", () => {
    expect(deriveTheme(preset).invariant["radius"]).toBe("0.5rem");
    expect(deriveTheme(preset).invariant["field-radius"]).toBe("0.75rem");
  });
  it("semanticOverrides побеждают выведенное значение", () => {
    const {light} = deriveTheme({...preset,
      semanticOverrides: {light: {danger: {color: "oklch(0.48 0.19 27.64)"}}}});
    expect(light["danger"]).toBe("oklch(0.48 0.19 27.64)");
  });
  it("darkAccent используется в тёмной схеме", () => {
    const {dark} = deriveTheme({...preset, accent: "oklch(0 0 0)", darkAccent: "oklch(0.98 0 0)"});
    expect(parseOklch(dark["accent"]!)?.l).toBeCloseTo(0.98, 2);
  });
  it("каждая текстовая пара держит 4.5:1 после вывода", () => {
    const {light, dark} = deriveTheme(preset);
    for (const scheme of [light, dark]) {
      for (const [name, value] of Object.entries(scheme)) {
        if (!name.endsWith("-foreground")) continue;
        const bgName = name.replace(/-foreground$/, "");
        const bg = parseOklch(scheme[bgName] ?? scheme["background"]!)!;
        const base = parseOklch(scheme["background"]!)!;
        expect(contrastRatio(parseOklch(value)!, compositeOver(bg, base)), name)
          .toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @peakui/styles exec vitest run derive`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `derive.ts`**

Build the scheme sets from the preset, then the calculated set strictly following the spec's **Таблица вывода** — every percentage comes from that table, none invented. Neutrals (`background`, `surface*`, `muted`, `default`, `border`, `separator`) take the accent's hue at `grayChroma`. Apply `semanticOverrides` **before** deriving anything from a semantic colour. Put the font stacks into the invariant set as `sans` / `mono`, joined with `", "`, defaulting to the spec's §3 choices when the preset omits them. Run `ensureContrast` over every `X`/`X-foreground` pair as the final stage, compositing a translucent `X` over the scheme's base first, and collect every `ContrastFix`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @peakui/styles exec vitest run derive`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/styles/src/generator/preset.ts packages/styles/src/generator/derive.ts packages/styles/src/generator/derive.test.ts
git commit -m "feat(styles): вывод токенов темы из пресета"
```

---

### Task 5: CSS emission

**Files:**
- Create: `packages/styles/src/generator/emit.ts`
- Test: `packages/styles/src/generator/emit.test.ts`

**Interfaces:**
- Consumes: Task 4's `deriveTheme` output.
- Produces: `emitVariablesCss(preset: ThemePreset, derived: ReturnType<typeof deriveTheme>): string`

- [ ] **Step 1: Write the failing tests**

```ts
describe("emitVariablesCss", () => {
  const css = emitVariablesCss(preset, deriveTheme(preset));

  it("оборачивает всё в @layer base", () => {
    expect(css.startsWith("@layer base {")).toBe(true);
  });
  it("объявляет инварианты на :root и :host", () => {
    expect(css).toMatch(/:root,\s*:host\s*\{/);
  });
  it("даёт светлой теме и класс, и атрибут, и :host-формы", () => {
    expect(css).toContain('[data-theme="test-light"]');
    expect(css).toContain(':host([data-theme="test-light"])');
  });
  it("объявляет color-scheme в каждой схеме", () => {
    expect(css.match(/color-scheme: light/g)?.length).toBe(1);
    expect(css.match(/color-scheme: dark/g)?.length).toBe(1);
  });
  it("эмитит один блок forced-colors на тему", () => {
    expect(css.match(/@media \(forced-colors: active\)/g)?.length).toBe(1);
    expect(css).toContain("--surface: Canvas");
    expect(css).toContain("--accent: Highlight");
  });
  it("не содержит ни hex, ни rgb(", () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\brgb\(/);
  });
  it("детерминирован", () => {
    expect(emitVariablesCss(preset, deriveTheme(preset))).toBe(css);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @peakui/styles exec vitest run emit`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `emit.ts`**

Emit `@layer base { … }` containing: the `:root, :host` invariant block; one block per scheme with the selector list from the spec's §5 (`.<id>-<scheme>`, `[data-theme="<id>-<scheme>"]`, and the `:host(…)` forms, with the light scheme also matching bare `:root`) and `color-scheme`; and one `@media (forced-colors: active)` block mapping the roles to system colours per the spec. Sort tokens by name within each block so the output is byte-stable. `backdrop` is emitted as `oklch(0 0 0 / 0.5)`, not `rgba()` — the spec allows no literal `rgb(` anywhere, and the alpha form carries the same colour.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @peakui/styles exec vitest run emit`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/styles/src/generator/emit.ts packages/styles/src/generator/emit.test.ts
git commit -m "feat(styles): эмиссия variables.css"
```

---

### Task 6: The stable `@theme inline` surface

**Files:**
- Create: `packages/styles/themes/shared/theme.css`
- Test: `packages/styles/src/generator/theme-surface.test.ts`

**Interfaces:**
- Consumes: Task 4's `deriveTheme` (to check every mapping resolves).
- Produces: the authored `theme.css`; no TypeScript API.

- [ ] **Step 1: Write the failing test**

```ts
describe("theme.css", () => {
  const css = readFileSync("themes/shared/theme.css", "utf8");
  const mapped = [...css.matchAll(/^\s*--[\w-]+:\s*var\(--([\w-]+)[,)]/gm)].map((m) => m[1]!);

  it("каждый var() резолвится в объявленный токен", () => {
    const {invariant, light} = deriveTheme(defaultPreset);
    const declared = new Set([...Object.keys(invariant), ...Object.keys(light)]);
    expect(mapped.filter((name) => !declared.has(name))).toEqual([]);
  });
  it("объявляет шкалу радиусов множителями от --radius", () => {
    for (const step of ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl"]) {
      expect(css).toContain(`--radius-${step}: calc(var(--radius) *`);
    }
  });
  it("объявляет типографику: семейства, парную шкалу и веса", () => {
    expect(css).toContain("--font-sans: var(--sans)");
    expect(css).toContain("--font-mono: var(--mono)");
    expect(css).toContain("--text-sm--line-height");
    expect(css).toMatch(/--font-weight-medium:/);
  });
  it("не поджимает трекинг заголовков по умолчанию", () => {
    expect(css).not.toMatch(/--tracking-tight/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @peakui/styles exec vitest run theme-surface`
Expected: FAIL — `themes/shared/theme.css` does not exist.

- [ ] **Step 3: Author `theme.css`**

`@theme inline { … }` mapping every colour token to `var(--<raw>)`, the three shadows, the radius scale as `calc(var(--radius) * k)` for k ∈ {0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4}, the `--ease-*` curve set and `--animate-*` with their `@keyframes`, all per the spec's §1. Typography per the spec's §3: `--font-sans: var(--sans)`, `--font-mono: var(--mono)`, the `--text-*` scale with paired `--text-*--line-height` (line-heights set above a Latin-only system's, per the Cyrillic decision), and `--font-weight-*`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @peakui/styles exec vitest run theme-surface`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/styles/themes/shared/theme.css packages/styles/src/generator/theme-surface.test.ts
git commit -m "feat(styles): публичная поверхность @theme inline"
```

---

### Task 7: Default preset, CLI, committed output

**Files:**
- Create: `packages/styles/presets/default.ts`, `packages/styles/presets/index.ts`
- Create: `packages/styles/src/generator/index.ts`, `packages/styles/scripts/build-tokens.mjs`
- Create (generated): `packages/styles/themes/default/{variables.css,index.css,components/index.css}`
- Modify: `packages/styles/package.json` (add `tokens:build`)
- Test: `packages/styles/src/generator/build.test.ts`

**Interfaces:**
- Consumes: Tasks 4–6.
- Produces: `defaultPreset: ThemePreset`; `buildTheme(preset): {path: string; css: string}[]`; `pnpm tokens:build`.

- [ ] **Step 1: Write the failing test**

```ts
describe("buildTheme", () => {
  it("default проходит проверку контраста без правок", () => {
    expect(deriveTheme(defaultPreset).fixes).toEqual([]);
  });
  it("пишет три файла темы", () => {
    const paths = buildTheme(defaultPreset).map((f) => f.path);
    expect(paths).toEqual([
      "themes/default/variables.css",
      "themes/default/index.css",
      "themes/default/components/index.css",
    ]);
  });
  it("index.css импортирует общую поверхность, свои переменные и свои компоненты", () => {
    const index = buildTheme(defaultPreset).find((f) => f.path.endsWith("default/index.css"))!.css;
    expect(index).toContain('@import "../shared/theme.css"');
    expect(index).toContain('@import "./variables.css" layer(theme)');
    expect(index).toContain('@import "./components/index.css" layer(components)');
  });
});
```

Note: the first assertion is a real requirement, not a formality — a default palette that needs a contrast fix is a palette chosen wrong.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @peakui/styles exec vitest run build`
Expected: FAIL — `defaultPreset` not exported.

- [ ] **Step 3: Implement the preset, `buildTheme` and the CLI**

`defaultPreset` exactly as the spec's §2 fixes it: `accent: "oklch(0.58 0.20 275)"`, `grayChroma: 0.006`, `radius: "medium"`, `formRadius: "large"`. `buildTheme` returns the three files; `scripts/build-tokens.mjs` writes them for every preset and prints each `ContrastFix`. Add `"tokens:build": "node scripts/build-tokens.mjs"`.

- [ ] **Step 4: Run the generator, then the tests**

Run: `pnpm --filter @peakui/styles tokens:build && pnpm --filter @peakui/styles exec vitest run`
Expected: three files written under `themes/default/`; all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/styles/presets packages/styles/src/generator/index.ts packages/styles/scripts packages/styles/themes/default packages/styles/package.json packages/styles/src/generator/build.test.ts
git commit -m "feat(styles): пресет default, CLI tokens:build и сгенерированная тема"
```

---

### Task 8: Package exports

**Files:**
- Modify: `packages/styles/package.json`
- Create: `packages/styles/index.css`
- Test: `packages/styles/src/generator/exports.test.ts`

**Interfaces:**
- Consumes: Task 7's emitted theme.
- Produces: the public export map, including `./generator` for `peakui-pro`.

- [ ] **Step 1: Write the failing test**

```ts
describe("exports", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  it("объявляет пути из спеки", () => {
    for (const key of ["./css", "./themes/default", "./themes/*/*.css", "./base",
                       "./components/*.css", "./utilities", "./variants", "./generator"]) {
      expect(pkg.exports, key).toHaveProperty([key]);
    }
  });
  it("держит sideEffects: false", () => {
    expect(pkg.sideEffects).toBe(false);
  });
  it("экспортирует генератор как публичный API для Pro", () => {
    expect(pkg.exports["./generator"]).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @peakui/styles exec vitest run exports`
Expected: FAIL — `exports` map missing keys.

- [ ] **Step 3: Write the export map and `index.css`**

Export map per the spec's §5. `index.css` imports the default theme and the component layer. Add `publint` and `@arethetypeswrong/cli` as devDeps with a `lint:package` script running both.

- [ ] **Step 4: Run test and the package linters**

Run: `pnpm --filter @peakui/styles exec vitest run exports && pnpm --filter @peakui/styles lint:package`
Expected: tests PASS; `publint` and `attw` clean.

- [ ] **Step 5: Commit**

```bash
git add packages/styles/package.json packages/styles/index.css packages/styles/src/generator/exports.test.ts
git commit -m "feat(styles): карта экспортов и гейты publint/attw"
```

---

### Task 9: CI gates

**Files:**
- Create: `packages/styles/scripts/check-tokens.mjs`
- Create: `.github/workflows/ci.yml`
- Modify: root `package.json` (add `check:tokens`)
- Test: `packages/styles/src/generator/check-tokens.test.ts`

**Interfaces:**
- Consumes: Tasks 6–7.
- Produces: `checkTokens(): {errors: string[]}` — the five gates from the spec's §6.

- [ ] **Step 1: Write the failing tests**

```ts
describe("checkTokens", () => {
  it("на чистом дереве ошибок нет", () => {
    expect(checkTokens().errors).toEqual([]);
  });
  it("ловит дрейф между пресетом и закоммиченным CSS", () => {
    expect(checkTokens({committed: {"themes/default/variables.css": "/* stale */"}}).errors)
      .toContainEqual(expect.stringMatching(/дрейф/i));
  });
  it("ловит висящий токен из theme.css", () => {
    expect(checkTokens({themeCss: "@theme inline { --color-x: var(--nope); }"}).errors)
      .toContainEqual(expect.stringMatching(/--nope/));
  });
  it("ловит неполную тему", () => {
    expect(checkTokens({extraTheme: {id: "partial", tokens: {background: "oklch(1 0 0)"}}}).errors)
      .toContainEqual(expect.stringMatching(/partial/));
  });
  it("ловит литеральный цвет в components/*.css", () => {
    expect(checkTokens({componentCss: {"chip.css": ".chip { color: #fff; }"}}).errors)
      .toContainEqual(expect.stringMatching(/chip\.css/));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @peakui/styles exec vitest run check-tokens`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `check-tokens.mjs`**

Five gates from the spec's §6: regenerate and compare against the committed CSS; re-run the contrast verification over every preset; every `var(--x)` in `theme.css` resolves in every theme; every theme declares the full set that `default` declares; no hex, `rgb(`, `hsl(` or numbered token (`-[0-9]+\b`) in `components/*.css`. Each gate pushes a Russian-language error naming the file and the offending token. Accept optional injected fixtures so the tests above can drive each gate without touching the real tree. `ci.yml` runs install, `test`, `lint:package`, `check:tokens` on Node 22 and 24.

- [ ] **Step 4: Run tests and the gate itself**

Run: `pnpm --filter @peakui/styles exec vitest run check-tokens && pnpm check:tokens`
Expected: tests PASS; the gate reports no errors on the real tree.

- [ ] **Step 5: Commit**

```bash
git add packages/styles/scripts/check-tokens.mjs packages/styles/src/generator/check-tokens.test.ts .github/workflows/ci.yml package.json
git commit -m "feat(styles): гейты CI для слоя токенов"
```
