# Theme Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `/themes` route in the docs app where a visitor tunes a PeakUI theme over the published generator API and exports CSS, a `ThemePreset` snippet, and a shareable URL.

**Architecture:** The browser imports `deriveTheme`/`emitVariablesCss` from `@peakui/styles/generator` (the `./generator` subpath export already exists in the package exports map). Theme state lives in URL query params; every edit re-derives tokens and injects scoped CSS into the preview container. The one core change is a `scope` option on `emitVariablesCss`. No second color math anywhere.

**Tech Stack:** Next.js 16 App Router + React 19 (client components), `@peakui/styles/generator` (workspace, TS source), zod 4 (URL validation), vitest (docs app `tests/` dir, package suite), peakui components for the builder UI itself.

**Spec:** `docs/superpowers/specs/2026-10-11-theme-builder-design.md` — read it before starting; this plan argues from it.

## Global Constraints

- Work inside a **git worktree** of this repository (branch `theme-builder` off `p2-wave`), created via superpowers:using-git-worktrees before Task 1.
- All new documents, comments, test descriptions and UI copy: **English**. Nothing a visitor reads may name the vendored reference library.
- Conventional Commits, header ≤ 150 chars. No changeset, no codemod (release stage is switched off).
- Named exports only; component files kebab-case. Docs-app JSX may use Tailwind utilities freely (the "no Tailwind in JSX" rule binds `@peakui/react`, not apps).
- `emitVariablesCss` output **without** the scope option must stay byte-identical — the token drift gate (`pnpm --filter @peakui/styles check:tokens`) must pass unchanged.
- Never edit generated registries by hand; this plan adds no demos or components, so `pnpm registries` is not needed.
- CodeGraph completion criterion: quote the first CodeGraph query result of the session in the task summary (already satisfied in the spec session — keep the habit if you query again).
- Commands run from the worktree root unless noted. Docs dev server: `pnpm dev:docs` (port 3000); its URL for smoke checks is `http://localhost:3000/en/themes`.

## File Structure

```
packages/styles/src/generator/emit.ts            # scope option (only core change)
packages/styles/src/generator/emit.test.ts       # scoped-emission tests
apps/docs/src/app/[lang]/themes/
  page.tsx                    # server shell: metadata + <ThemeBuilder/> in Suspense
  theme-builder.tsx           # client frame: header + preview + controls + code panel
  use-builder-state.ts        # URL ↔ state (decode/encode, set/reset) via next/navigation
  use-builder-theme.ts        # deriveTheme + scoped emit, memoized/deferred
  theme-preview.tsx           # <style> injection + data-theme container
  presets.ts                  # BuilderValues, gallery, toPreset, matchGallery (pure)
  url-codec.ts                # zod-validated query-param codec (pure)
  accent-popover.tsx          # OKLCH sliders, hex input, swatches, darkAccent
  controls.tsx                # grayChroma slider, radii, scheme switch, contrast chips
  contrast-chips.tsx          # derived.fixes → chips
  code-panel.tsx              # CSS | Preset tabs, name field, copy/download
  preview/gallery.tsx         # live component gallery
apps/docs/tests/themes/       # url-codec.test.ts, presets.test.ts, theme-preview.test.tsx
apps/docs/src/lib/dictionaries/en.json          # nav.themes
apps/docs/src/app/[lang]/(home)/home-layout-links.tsx  # nav link
```

Pure modules (`presets.ts`, `url-codec.ts`) hold all logic that tests can reach without a browser; React files stay thin glue.

---

### Task 1: `scope` option on `emitVariablesCss`

**Files:**
- Modify: `packages/styles/src/generator/emit.ts`
- Test: `packages/styles/src/generator/emit.test.ts` (append a describe block)

**Interfaces:**
- Consumes: existing `emitVariablesCss(preset, derived)`, `selectorsFor(id, scheme)`.
- Produces: `emitVariablesCss(preset: ThemePreset, derived: Derived, options?: {scope?: string}): string` — used by Tasks 3 and 5. With `scope: "#tb-preview"` the invariant and forced-colors blocks anchor on the scope itself, class/attribute selectors get the scope prefix, `:host(...)` variants are dropped. Without the option the output is byte-identical to today's.

- [ ] **Step 1: Write the failing tests**

Append to `packages/styles/src/generator/emit.test.ts` (keep the existing suite untouched):

```ts
describe("emitVariablesCss with scope", () => {
  const derived = deriveTheme(preset);
  const scoped = emitVariablesCss(preset, derived, {scope: "#tb-preview"});

  it("anchors invariants on the scope instead of :root/:host", () => {
    expect(scoped).toContain("#tb-preview {");
    expect(scoped).not.toContain(":root");
    expect(scoped).not.toContain(":host");
  });

  it("prefixes class and attribute selectors with the scope", () => {
    expect(scoped).toContain("#tb-preview.test-light");
    expect(scoped).toContain('#tb-preview[data-theme="test-light"]');
    expect(scoped).toContain("#tb-preview.test-dark");
    expect(scoped).toContain('#tb-preview[data-theme="test-dark"]');
  });

  it("keeps color-scheme and forced-colors content", () => {
    expect(scoped.match(/color-scheme: light/g)?.length).toBe(1);
    const media = scoped.slice(scoped.indexOf("@media (forced-colors"));
    expect(media).toContain("#tb-preview {");
    expect(media).toContain("--accent: Highlight");
  });

  it("leaves the unscoped output byte-identical", () => {
    expect(emitVariablesCss(preset, derived)).toBe(emitVariablesCss(preset, derived, {}));
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @peakui/styles test -- src/generator/emit.test.ts`
Expected: FAIL — `emitVariablesCss` ignores the third argument; `#tb-preview` assertions miss.

- [ ] **Step 3: Implement the scope option**

In `emit.ts`, extend `selectorsFor` and `emitVariablesCss`:

```ts
/** A scope re-anchors a theme onto a container, for embedding (the theme builder's preview). */
const scopedSelectors = (selectors: string[], scope: string): string[] =>
  selectors
    .filter((selector) => !selector.startsWith(":host"))
    .map((selector) => (selector === ":root" || selector === ":host" ? scope : `${scope}${selector}`));
```

Inside `selectorsFor(id, scheme, scope?: string)`, keep building the current list, then:

```ts
  return (scope === undefined ? selectors : scopedSelectors(selectors, scope)).join(",\n");
```

In `emitVariablesCss`, add the third parameter `options: {scope?: string} = {}`, pass `options.scope` through to `selectorsFor`, and replace both `:root,\n:host` anchors — the invariant block (indent level 1) and the forced-colors block (indent level 2) — with a shared local. The two anchors sit at different indents, so the local takes the indent:

```ts
  const anchor = (indent: string): string =>
    options.scope === undefined ? `${indent}:root,\n${indent}:host` : `${indent}${options.scope}`;
```

Use `anchor(INDENT)` for the invariant block and `anchor(INDENT.repeat(2))` inside the `@media (forced-colors: active)` block. Do not touch sorting, comments or any other byte the unscoped path emits.

- [ ] **Step 4: Run tests and gates**

Run: `pnpm --filter @peakui/styles test` — Expected: PASS (old suite + new).
Run: `pnpm --filter @peakui/styles check:tokens` — Expected: exit 0, no drift errors (proves byte-stability).

- [ ] **Step 5: Commit**

```bash
git add packages/styles/src/generator/emit.ts packages/styles/src/generator/emit.test.ts
git commit -m "feat(styles): scoped emission of generated themes for embedding"
```

---

### Task 2: Builder domain — gallery presets and URL codec

**Files:**
- Create: `apps/docs/src/app/[lang]/themes/presets.ts`
- Create: `apps/docs/src/app/[lang]/themes/url-codec.ts`
- Test: `apps/docs/tests/themes/presets.test.ts`
- Test: `apps/docs/tests/themes/url-codec.test.ts`

**Interfaces:**
- Consumes: `ThemePreset`, `RadiusId`, `deriveTheme` from `@peakui/styles/generator`; `defaultPreset` accent `"oklch(0.555 0.215 262)"` (values mirrored from `packages/styles/presets/default.ts` — read it and copy the values, do not import the preset: builder defaults are values, not the core theme).
- Produces (used by Tasks 3–6):
  - `type BuilderValues = {accent: string; grayChroma: number; radius: RadiusId; formRadius: RadiusId; darkAccent?: string}`
  - `const BUILDER_THEME_ID = "builder"`
  - `const DEFAULT_VALUES: BuilderValues`
  - `type GalleryPreset = {name: string; values: BuilderValues; semanticOverrides?: ThemePreset["semanticOverrides"]}`
  - `const GALLERY: GalleryPreset[]`
  - `toPreset(values: BuilderValues, semanticOverrides?: ThemePreset["semanticOverrides"], id?: string): ThemePreset` (id defaults to `BUILDER_THEME_ID`)
  - `matchGallery(values: BuilderValues): string` — gallery name or `"Custom"`
  - `type BuilderState = BuilderValues & {scheme: "light" | "dark"}`
  - `const DEFAULT_STATE: BuilderState`
  - `decodeBuilderState(search: string): BuilderState`
  - `encodeBuilderState(state: BuilderState): Record<string, string>` (defaults omitted)

- [ ] **Step 1: Write the failing tests**

`apps/docs/tests/themes/presets.test.ts`:

```ts
import {describe, expect, it} from "vitest";

import {deriveTheme} from "@peakui/styles/generator";

import {DEFAULT_VALUES, GALLERY, matchGallery, toPreset} from "@/app/[lang]/themes/presets";

describe("gallery", () => {
  it("derives every preset through the engine without error", () => {
    for (const preset of GALLERY) {
      expect(() =>
        deriveTheme(toPreset(preset.values, preset.semanticOverrides)),
      ).not.toThrow();
    }
  });

  it("matches its own values and reports tweaks as Custom", () => {
    expect(matchGallery(DEFAULT_VALUES)).toBe("Default");
    expect(matchGallery({...DEFAULT_VALUES, grayChroma: 0.01})).toBe("Custom");
  });
});
```

`apps/docs/tests/themes/url-codec.test.ts`:

```ts
import {describe, expect, it} from "vitest";

import type {BuilderState} from "@/app/[lang]/themes/url-codec";

import {DEFAULT_STATE, decodeBuilderState, encodeBuilderState} from "@/app/[lang]/themes/url-codec";

describe("encodeBuilderState", () => {
  it("omits defaults entirely", () => {
    expect(encodeBuilderState(DEFAULT_STATE)).toEqual({});
  });

  it("encodes every non-default field compactly", () => {
    const state: BuilderState = {
      accent: "#e50914",
      grayChroma: 0.005,
      radius: "small",
      formRadius: "small",
      darkAccent: "#ff0",
      scheme: "dark",
    };

    expect(encodeBuilderState(state)).toEqual({
      a: "#e50914",
      g: "0.005",
      r: "small",
      f: "small",
      da: "#ff0",
      s: "dark",
    });
  });
});

describe("decodeBuilderState", () => {
  it("returns defaults for an empty query", () => {
    expect(decodeBuilderState("")).toEqual(DEFAULT_STATE);
  });

  it("round-trips an encoded state exactly", () => {
    const state: BuilderState = {
      accent: "#e50914",
      grayChroma: 0.005,
      radius: "small",
      formRadius: "small",
      scheme: "dark",
    };
    const query = new URLSearchParams(encodeBuilderState(state)).toString();

    expect(decodeBuilderState(query)).toEqual(state);
  });

  it("keeps darkAccent optional on decode", () => {
    expect(decodeBuilderState("?a=%231db954&s=dark")).toEqual({
      ...DEFAULT_STATE,
      accent: "#1db954",
      scheme: "dark",
    });
  });

  it("falls back to defaults when any param is invalid", () => {
    expect(decodeBuilderState("?a=%23zz&g=abc&r=huge")).toEqual(DEFAULT_STATE);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @peakui/docs test`
Expected: FAIL — module `@/app/[lang]/themes/presets` (and url-codec) cannot be resolved.

- [ ] **Step 3: Implement `presets.ts`**

```ts
import type {RadiusId, ThemePreset} from "@peakui/styles/generator";

/** What the builder edits: a ThemePreset minus identity, plus nothing else. */
export type BuilderValues = {
  accent: string;
  grayChroma: number;
  radius: RadiusId;
  formRadius: RadiusId;
  darkAccent?: string;
};

/** The preview derives one theme under this id; the export uses the user's own id. */
export const BUILDER_THEME_ID = "builder";

/** The engine's default theme as builder values — the reset target. Mirrors presets/default.ts. */
export const DEFAULT_VALUES: BuilderValues = {
  accent: "oklch(0.555 0.215 262)",
  grayChroma: 0.006,
  radius: "medium",
  formRadius: "large",
};

export type GalleryPreset = {
  name: string;
  values: BuilderValues;
  semanticOverrides?: ThemePreset["semanticOverrides"];
};

/*
 * Editor inputs, not shipped themes: picking one writes its values into the URL, nothing is
 * added to @peakui/styles (spec, "Boundaries").
 */
export const GALLERY: GalleryPreset[] = [
  {name: "Default", values: DEFAULT_VALUES},
  {
    name: "Spotify",
    values: {accent: "#1db954", grayChroma: 0.008, radius: "medium", formRadius: "large"},
  },
  {
    name: "Netflix",
    values: {accent: "#e50914", grayChroma: 0.005, radius: "small", formRadius: "small"},
    semanticOverrides: {
      light: {danger: {color: "#e50914"}},
      dark: {danger: {color: "#e50914"}},
    },
  },
  {
    name: "Mint",
    values: {
      accent: "oklch(0.68 0.14 165)",
      grayChroma: 0.01,
      radius: "large",
      formRadius: "extra-large",
    },
  },
  {
    name: "Lavender",
    values: {
      accent: "oklch(0.62 0.17 300)",
      grayChroma: 0.012,
      radius: "medium",
      formRadius: "large",
    },
  },
  {
    name: "Graphite",
    values: {
      accent: "#18181b",
      darkAccent: "#e4e4e7",
      grayChroma: 0.003,
      radius: "small",
      formRadius: "small",
    },
  },
];

export function toPreset(
  values: BuilderValues,
  semanticOverrides?: ThemePreset["semanticOverrides"],
  id: string = BUILDER_THEME_ID,
): ThemePreset {
  return {
    id,
    accent: values.accent,
    grayChroma: values.grayChroma,
    radius: values.radius,
    formRadius: values.formRadius,
    ...(values.darkAccent ? {darkAccent: values.darkAccent} : {}),
    ...(semanticOverrides ? {semanticOverrides} : {}),
  };
}

/** Values → gallery name. The URL stores values, so equality is exact after a round-trip. */
export function matchGallery(values: BuilderValues): string {
  const same = (candidate: BuilderValues): boolean =>
    candidate.accent === values.accent &&
    Math.abs(candidate.grayChroma - values.grayChroma) < 1e-9 &&
    candidate.radius === values.radius &&
    candidate.formRadius === values.formRadius &&
    candidate.darkAccent === values.darkAccent;

  return GALLERY.find((preset) => same(preset.values))?.name ?? "Custom";
}
```

- [ ] **Step 4: Implement `url-codec.ts`**

```ts
import {z} from "zod";

import type {BuilderValues} from "./presets";

import {DEFAULT_VALUES} from "./presets";

export type BuilderState = BuilderValues & {scheme: "light" | "dark"};

export const DEFAULT_STATE: BuilderState = {...DEFAULT_VALUES, scheme: "light"};

const RADIUS_IDS = ["none", "extra-small", "small", "medium", "large", "extra-large"] as const;

/*
 * A colour string the engine can parse (hex or oklch(...)); precise validation belongs to
 * parseOklch inside the engine, so the codec only rejects emptiness and lets deriveTheme fail
 * loudly if fed something impossible through a hand-crafted URL.
 */
const accentSchema = z.string().trim().min(4);

const partialSchema = z.object({
  a: accentSchema.optional(),
  g: z.number().min(0).max(0.03).optional(),
  r: z.enum(RADIUS_IDS).optional(),
  f: z.enum(RADIUS_IDS).optional(),
  da: accentSchema.optional(),
  s: z.enum(["light", "dark"]).optional(),
});

const numberOrUndefined = (raw: string | null): number | undefined =>
  raw === null ? undefined : Number(raw);

/** Query string → builder state. Any invalid param collapses the whole state to defaults. */
export function decodeBuilderState(search: string): BuilderState {
  const params = new URLSearchParams(search);
  const parsed = partialSchema.safeParse({
    a: params.get("a") ?? undefined,
    g: numberOrUndefined(params.get("g")),
    r: params.get("r") ?? undefined,
    f: params.get("f") ?? undefined,
    da: params.get("da") ?? undefined,
    s: params.get("s") ?? undefined,
  });

  if (!parsed.success) return DEFAULT_STATE;

  return {
    accent: parsed.data.a ?? DEFAULT_STATE.accent,
    grayChroma: parsed.data.g ?? DEFAULT_STATE.grayChroma,
    radius: parsed.data.r ?? DEFAULT_STATE.radius,
    formRadius: parsed.data.f ?? DEFAULT_STATE.formRadius,
    darkAccent: parsed.data.da ?? DEFAULT_STATE.darkAccent,
    scheme: parsed.data.s ?? DEFAULT_STATE.scheme,
  };
}

/** State → query-param record, defaults omitted so a clean theme keeps a clean URL. */
export function encodeBuilderState(state: BuilderState): Record<string, string> {
  const params: Record<string, string> = {};

  if (state.accent !== DEFAULT_STATE.accent) params.a = state.accent;
  if (state.grayChroma !== DEFAULT_STATE.grayChroma) params.g = String(state.grayChroma);
  if (state.radius !== DEFAULT_STATE.radius) params.r = state.radius;
  if (state.formRadius !== DEFAULT_STATE.formRadius) params.f = state.formRadius;
  if (state.darkAccent !== undefined) params.da = state.darkAccent;
  if (state.scheme !== DEFAULT_STATE.scheme) params.s = state.scheme;

  return params;
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm --filter @peakui/docs test` — Expected: PASS (both new files).
Run: `pnpm --filter @peakui/docs typecheck` — Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/docs/src/app/[lang]/themes/presets.ts apps/docs/src/app/[lang]/themes/url-codec.ts apps/docs/tests/themes/
git commit -m "feat(docs): theme builder domain — gallery presets and url codec"
```

---

### Task 3: State hook, theme hook, preview surface, page skeleton

**Files:**
- Create: `apps/docs/src/app/[lang]/themes/use-builder-state.ts`
- Create: `apps/docs/src/app/[lang]/themes/use-builder-theme.ts`
- Create: `apps/docs/src/app/[lang]/themes/theme-preview.tsx`
- Create: `apps/docs/src/app/[lang]/themes/theme-builder.tsx`
- Create: `apps/docs/src/app/[lang]/themes/page.tsx`
- Test: `apps/docs/tests/themes/theme-preview.test.tsx`

**Interfaces:**
- Consumes: Task 2's `url-codec` and `presets`; Task 1's scoped `emitVariablesCss`; `deriveTheme` from the generator.
- Produces (used by Tasks 4–6):
  - `useBuilderState(): {state: BuilderState; set(patch: Partial<BuilderState>): void; reset(): void; isDefault: boolean}`
  - `const PREVIEW_SCOPE = "#tb-preview"` and `const PREVIEW_ID = "tb-preview"`
  - `useBuilderTheme(state, semanticOverrides?): {preset: ThemePreset; derived: ReturnType<typeof deriveTheme>; previewCss: string; scheme: Scheme}`
  - `ThemePreview({children, css, scheme})` — the `<style>`-injecting container
  - `ThemeBuilder()` — the client frame (Task 3 version: header + preview only)
  - Route `/en/themes` rendering `ThemeBuilder`

- [ ] **Step 1: Write the failing preview smoke test**

`apps/docs/tests/themes/theme-preview.test.tsx`:

```tsx
// @vitest-environment jsdom
import {act} from "react";
import {createRoot, type Root} from "react-dom/client";
import {afterAll, beforeAll, describe, expect, it} from "vitest";

import {deriveTheme, emitVariablesCss} from "@peakui/styles/generator";

import {DEFAULT_VALUES, toPreset} from "@/app/[lang]/themes/presets";
import {ThemePreview} from "@/app/[lang]/themes/theme-preview";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("ThemePreview", () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterAll(() => {
    root.unmount();
    host.remove();
  });

  it("applies the scoped css and the scheme attribute to the preview container", async () => {
    const preset = toPreset(DEFAULT_VALUES);
    const css = emitVariablesCss(preset, deriveTheme(preset), {scope: "#tb-preview"});

    await act(async () => {
      root.render(
        <ThemePreview css={css} scheme="dark">
          <p>preview content</p>
        </ThemePreview>,
      );
    });

    const container = host.querySelector("#tb-preview")!;

    expect(container.getAttribute("data-theme")).toBe("builder-dark");
    expect(container.querySelector("style")?.textContent).toContain(
      '#tb-preview[data-theme="builder-dark"]',
    );
    expect(container.textContent).toContain("preview content");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @peakui/docs test`
Expected: FAIL — `theme-preview` module missing.

- [ ] **Step 3: Implement the hooks and components**

`use-builder-state.ts`:

```ts
"use client";

import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {useCallback, useMemo} from "react";

import type {BuilderState} from "./url-codec";

import {decodeBuilderState, encodeBuilderState} from "./url-codec";

export function useBuilderState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state = useMemo(() => decodeBuilderState(searchParams.toString()), [searchParams]);

  /*
   * Every edit is a history push: the URL is the store, "Share" is "copy the URL", and
   * undo/redo rides the browser's back/forward buttons.
   */
  const set = useCallback(
    (patch: Partial<BuilderState>) => {
      const query = new URLSearchParams(encodeBuilderState({...state, ...patch})).toString();

      router.push(query ? `${pathname}?${query}` : pathname, {scroll: false});
    },
    [router, pathname, state],
  );

  const reset = useCallback(() => router.push(pathname, {scroll: false}), [router, pathname]);

  return {state, set, reset, isDefault: searchParams.size === 0};
}
```

`use-builder-theme.ts`:

```ts
"use client";

import type {Scheme, ThemePreset} from "@peakui/styles/generator";
import type {BuilderState} from "./url-codec";

import {useDeferredValue, useMemo} from "react";

import {deriveTheme, emitVariablesCss} from "@peakui/styles/generator";

import {toPreset} from "./presets";

export const PREVIEW_SCOPE = "#tb-preview";

export function useBuilderTheme(
  state: BuilderState,
  semanticOverrides?: ThemePreset["semanticOverrides"],
) {
  const {accent, grayChroma, radius, formRadius, darkAccent, scheme} = state;

  const preset = useMemo(
    () => toPreset({accent, grayChroma, radius, formRadius, darkAccent}, semanticOverrides),
    [accent, grayChroma, radius, formRadius, darkAccent, semanticOverrides],
  );
  const derived = useMemo(() => deriveTheme(preset), [preset]);
  const previewCss = useDeferredValue(
    useMemo(
      () => emitVariablesCss(preset, derived, {scope: PREVIEW_SCOPE}),
      [preset, derived],
    ),
  );

  return {preset, derived, previewCss, scheme: scheme as Scheme};
}
```

`theme-preview.tsx`:

```tsx
"use client";

import type {Scheme} from "@peakui/styles/generator";
import type {ReactNode} from "react";

export const PREVIEW_ID = "tb-preview";

/*
 * The scoped emission anchors every selector on #tb-preview, so the builder theme reaches the
 * preview and nothing else; the site's own default-light/dark classes on <html> keep styling
 * the page chrome.
 */
export function ThemePreview({
  children,
  css,
  scheme,
}: {
  children: ReactNode;
  css: string;
  scheme: Scheme;
}) {
  return (
    <div
      className="flex-1 overflow-y-auto bg-background text-foreground"
      data-theme={`builder-${scheme}`}
      id={PREVIEW_ID}
    >
      <style dangerouslySetInnerHTML={{__html: css}} />
      {children}
    </div>
  );
}
```

`theme-builder.tsx` (Task 3 version — header grows a real toolbar in Task 4):

```tsx
"use client";

import {Suspense} from "react";
import Link from "next/link";

import {ThemePreview} from "./theme-preview";
import {useBuilderState} from "./use-builder-state";
import {useBuilderTheme} from "./use-builder-theme";

function Builder() {
  const {state} = useBuilderState();
  const {derived, previewCss, scheme} = useBuilderTheme(state);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center gap-4 border-b border-separator px-6 py-4">
        <Link className="text-sm font-medium text-foreground" href="/en">
          PeakUI
        </Link>
        <h1 className="text-sm font-medium text-muted">Theme Builder</h1>
      </header>
      <main className="flex min-h-0 flex-1 flex-col">
        <ThemePreview css={previewCss} scheme={scheme}>
          <div className="p-6" />
        </ThemePreview>
      </main>
    </div>
  );
}

export function ThemeBuilder() {
  return (
    <Suspense fallback={null}>
      <Builder />
    </Suspense>
  );
}
```

`page.tsx`:

```tsx
import type {Metadata} from "next";

import {ThemeBuilder} from "./theme-builder";

export const metadata: Metadata = {
  description:
    "Tune a PeakUI theme — accent, neutrals, radii — with a live preview, then export CSS or a preset.",
  title: "Theme Builder",
};

export default function ThemesPage() {
  return <ThemeBuilder />;
}
```

- [ ] **Step 4: Run tests, typecheck, and smoke the route**

Run: `pnpm --filter @peakui/docs test` — Expected: PASS.
Run: `pnpm --filter @peakui/docs typecheck` — Expected: PASS.
Run: `pnpm dev:docs` (background), open `http://localhost:3000/en/themes` — Expected: header renders, empty preview area, no console errors.

- [ ] **Step 5: Commit**

```bash
git add apps/docs/src/app/[lang]/themes/ apps/docs/tests/themes/theme-preview.test.tsx
git commit -m "feat(docs): theme builder frame — url state, engine hook, scoped preview"
```

---

### Task 4: Controls — accent popover, radii, scheme, contrast chips

**Files:**
- Create: `apps/docs/src/app/[lang]/themes/accent-popover.tsx`
- Create: `apps/docs/src/app/[lang]/themes/contrast-chips.tsx`
- Create: `apps/docs/src/app/[lang]/themes/controls.tsx`
- Modify: `apps/docs/src/app/[lang]/themes/theme-builder.tsx` (compose the toolbar)

**Interfaces:**
- Consumes: `useBuilderState().set`; `useBuilderTheme().derived.fixes: ContrastFix[]` where `ContrastFix = {token: string; from: number; to: number}` (verify the field names against `packages/styles/src/generator/contrast.ts` before writing the chip text — `check-tokens.ts` already formats them as `fix.token`, `fix.from`, `fix.to`); `parseOklch`/`formatOklch` from `@peakui/styles/generator` (both accept hex and oklch strings — `parseOklch("#1db954")` returns `{l, c, h, a}`).
- Produces: `ControlsPanel({state, set, fixes})` rendered under the preview; `ContrastChips({fixes})`.

Component API ground truth (verified in this repo): `SegmentedControl`/`SegmentedControl.Item` as used in `apps/docs/src/components/fumadocs/ui/theme-toggle.tsx`; `Slider` compound (`Slider.Track/Fill/Thumb/Output`) as in `packages/react/src/components/slider/slider.stories.tsx`; `Popover`, `TextField`+`Input`+`Label`, `Button`, `Chip` as in their stories. Before composing any component whose props you have not seen, read its stories file — do not write props from memory.

- [ ] **Step 1: Implement `accent-popover.tsx`**

Core logic (wrap the UI in peakui `Popover` + `Button` trigger labelled with the current accent swatch):

```tsx
"use client";

import type {BuilderValues} from "./presets";

import {parseOklch, formatOklch} from "@peakui/styles/generator";
import {useState} from "react";

const SWATCHES = [
  "oklch(0.555 0.215 262)", // default blue
  "#1db954",
  "#e50914",
  "oklch(0.68 0.14 165)",
  "oklch(0.62 0.17 300)",
  "#18181b",
  "#f59e0b",
  "#0ea5e9",
];

export function AccentPopover({
  values,
  onChange,
}: {
  values: BuilderValues;
  onChange: (patch: Partial<BuilderValues>) => void;
}) {
  const oklch = parseOklch(values.accent) ?? {l: 0.555, c: 0.215, h: 262, a: 1};
  const [hex, setHex] = useState("");

  const commit = (next: {l: number; c: number; h: number}) =>
    onChange({accent: formatOklch({l: next.l, c: next.c, h: next.h, a: 1})});

  const submitHex = () => {
    const parsed = parseOklch(hex.trim());

    if (parsed) onChange({accent: formatOklch(parsed)});
    setHex("");
  };

  // near-black / near-white accents cannot invert on their own — suggest darkAccent
  const needsDarkAccent = oklch.l < 0.25 || oklch.l > 0.85;
  const darkAccentHint = needsDarkAccent
    ? "This accent cannot invert on its own — set a separate accent for the dark scheme."
    : undefined;

  return (
    <Popover>
      <Button aria-label="Accent color" variant="tertiary">
        <span
          aria-hidden="true"
          className="size-4 rounded-field"
          style={{background: values.accent}}
        />
        Accent
      </Button>
      <Popover.Content className="flex w-80 flex-col gap-5 p-4">
        {/* Hue / chroma / lightness: peakui Slider compound, value/onChange via `commit`. */}
        <Slider maxValue={360} minValue={0} step={1} value={oklch.h}
          onChange={(h) => commit({l: oklch.l, c: oklch.c, h})}>
          <Label>Hue</Label>
          <Slider.Output />
          <Slider.Track><Slider.Fill /><Slider.Thumb /></Slider.Track>
        </Slider>
        <Slider maxValue={0.4} minValue={0} step={0.005} value={oklch.c}
          onChange={(c) => commit({l: oklch.l, c, h: oklch.h})}>
          <Label>Chroma</Label>
          <Slider.Output />
          <Slider.Track><Slider.Fill /><Slider.Thumb /></Slider.Track>
        </Slider>
        <Slider maxValue={1} minValue={0} step={0.005} value={oklch.l}
          onChange={(l) => commit({l, c: oklch.c, h: oklch.h})}>
          <Label>Lightness</Label>
          <Slider.Output />
          <Slider.Track><Slider.Fill /><Slider.Thumb /></Slider.Track>
        </Slider>
        {/* Hex input: commit on Enter through `submitHex`. Exact subparts (Label/Input
            placement, Popover.Content's real part name) follow the component's stories. */}
        <TextField className="w-full">
          <Label>Hex</Label>
          <Input
            onBlur={submitHex}
            onChange={setHex}
            onKeyDown={(event) => event.key === "Enter" && submitHex()}
            placeholder="#1db954"
            value={hex}
          />
        </TextField>
        <div className="flex flex-wrap gap-2">
          {SWATCHES.map((swatch) => (
            <button
              aria-label={`Accent ${swatch}`}
              className="size-6 rounded-field border border-border"
              key={swatch}
              onClick={() => onChange({accent: swatch})}
              style={{background: swatch}}
              type="button"
            />
          ))}
        </div>
        <TextField className="w-full">
          <Label>Accent for the dark scheme (optional)</Label>
          <Input
            onChange={(dark) => onChange({darkAccent: dark || undefined})}
            placeholder="#e4e4e7"
            value={values.darkAccent ?? ""}
          />
        </TextField>
        {darkAccentHint && <p className="text-xs text-muted">{darkAccentHint}</p>}
      </Popover.Content>
    </Popover>
  );
}
```

The skeleton above is the wiring; before running it, verify the exact part names and prop shapes against `packages/react/src/components/popover/popover.stories.tsx`, `slider.stories.tsx`, `textfield.stories.tsx` and `button.stories.tsx` (the verified excerpts: `Popover` wraps a `Button` trigger; `Slider` uses `Track/Fill/Thumb/Output`; `TextField` nests `Label` + `Input`). Adjust part names to what the stories show — do not keep a part name the stories contradict. Every visible string: English.

- [ ] **Step 2: Implement `contrast-chips.tsx` and `controls.tsx`**

```tsx
"use client";

import type {ContrastFix} from "@peakui/styles/generator";

import {Chip} from "@peakui/react";

/*
 * Transparency, not warnings: the engine guarantees contrast, and these chips show what it
 * adjusted to keep the guarantee (the spec's differentiator).
 */
export function ContrastChips({fixes}: {fixes: ContrastFix[]}) {
  if (fixes.length === 0) return null;

  return (
    <div aria-label="Contrast adjustments made by the engine" className="flex flex-wrap gap-2">
      {fixes.map((fix) => (
        <Chip key={fix.token}>
          {fix.token}: L {fix.from.toFixed(2)} → {fix.to.toFixed(2)}
        </Chip>
      ))}
    </div>
  );
}
```

`controls.tsx` renders (all labels English):
- `AccentPopover` (from Step 1),
- grayChroma `Slider` 0–0.03 step 0.001 labelled "Neutral saturation", writing `set({grayChroma})`,
- two `SegmentedControl`s "Radius" and "Form radius" over `["none","extra-small","small","medium","large","extra-large"]` with short labels `None/XS/S/M/L/XL`, writing `set({radius})` / `set({formRadius})` (follow `theme-toggle.tsx` for the exact SegmentedControl wiring),
- scheme `SegmentedControl` Light/Dark writing `set({scheme})`,
- `ContrastChips` fed from `derived.fixes`.

- [ ] **Step 3: Compose the toolbar in `theme-builder.tsx`**

Extend `Builder`: keep the header (add preset name via `matchGallery(values)` shown as text after the title, a Reset `Button` disabled when `isDefault`, a Share `Button` calling `navigator.clipboard.writeText(window.location.href)`), and render `<ControlsPanel>` below `ThemePreview` inside `main`, wired to `useBuilderState()` and `derived.fixes` from `useBuilderTheme`. The controls row uses `flex flex-wrap` so narrow screens stack the controls instead of clipping them (the spec's responsive floor; a dedicated mobile layout stays a follow-up). The gallery preset picker itself lands in Task 6 — leave its slot empty.

- [ ] **Step 4: Verify in the browser**

Run: `pnpm dev:docs`, open `http://localhost:3000/en/themes`.
Expected: hue slider changes the preview accent live; hex `#e50914` turns the gallery red; lightness extremes pop contrast chips; Light/Dark flips only the preview; Reset re-enables after any edit and clears the URL; browser Back undoes an edit.
Run: `pnpm --filter @peakui/docs test && pnpm --filter @peakui/docs typecheck` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/docs/src/app/[lang]/themes/
git commit -m "feat(docs): theme builder controls — accent, neutrals, radii, contrast chips"
```

---

### Task 5: Code panel — CSS and preset export

**Files:**
- Create: `apps/docs/src/app/[lang]/themes/code-panel.tsx`
- Modify: `apps/docs/src/app/[lang]/themes/theme-builder.tsx` (mount the panel)

**Interfaces:**
- Consumes: `useBuilderTheme().derived`; `emitVariablesCss` unscoped; `toPreset(values, undefined, id)`.
- Produces: `CodePanel({values, derived})`; `slugifyThemeId(raw: string): string` (lowercase, `[^a-z0-9-]+` → `-`, trimmed of leading/trailing `-`, fallback `"custom"`).

- [ ] **Step 1: Implement the export builders**

Inside `code-panel.tsx`:

```ts
type Derived = ReturnType<typeof deriveTheme>;

function buildExportCss(id: string, values: BuilderValues, derived: Derived): string {
  const usage = [
    `/* PeakUI theme "${id}".`,
    `   Import this file after @peakui/styles, then set data-theme="${id}-light"`,
    `   (or data-theme="${id}-dark") on the root element. */`,
  ].join("\n");

  return `${usage}\n${emitVariablesCss(toPreset(values, undefined, id), derived)}`;
}

function buildExportPreset(id: string, values: BuilderValues): string {
  const name = `${id.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())}Preset`;

  return [
    `import type {ThemePreset} from "@peakui/styles/generator";`,
    ``,
    `export const ${name}: ThemePreset = ${JSON.stringify(toPreset(values, undefined, id), null, 2)};`,
  ].join("\n");
}
```

- [ ] **Step 2: Implement the panel UI**

A right-side slide-over rendered from `theme-builder.tsx` behind a "Code" header toggle:
- name `TextField` (initial `"custom"`), slugified through `slugifyThemeId` for every export,
- `SegmentedControl` tabs `CSS | Preset` switching `buildExportCss` / `buildExportPreset`,
- `<pre>` with the deferred content (`useDeferredValue`) in a scrollable container,
- Copy `Button` (`navigator.clipboard.writeText`) and Download `Button`:

```ts
function download(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], {type: "text/plain"}));
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
```

CSS tab downloads `${id}-variables.css`, Preset tab downloads `${id}-preset.ts`.

- [ ] **Step 3: Verify in the browser**

`http://localhost:3000/en/themes`: rename to `MyBrand`; CSS tab shows `data-theme="mybrand-light"` selectors and the forced-colors block; Preset tab shows valid TS; Copy/Download produce the same bytes; slider drags do not stall the panel.
Run: `pnpm --filter @peakui/docs test && pnpm --filter @peakui/docs typecheck` — Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/src/app/[lang]/themes/code-panel.tsx apps/docs/src/app/[lang]/themes/theme-builder.tsx
git commit -m "feat(docs): theme builder code panel — css and preset export"
```

---

### Task 6: Preview gallery and preset picker

**Files:**
- Create: `apps/docs/src/app/[lang]/themes/preview/gallery.tsx`
- Modify: `apps/docs/src/app/[lang]/themes/theme-builder.tsx` (mount the gallery; add the preset picker in the header slot left by Task 4)

**Interfaces:**
- Consumes: peakui components from `@peakui/react` (list below). Prop APIs come from each component's stories at `packages/react/src/components/<name>/<name>.stories.tsx` — read before composing, never from memory.
- Produces: `PreviewGallery()` — self-contained, themed by the preview container it renders inside.

- [ ] **Step 1: Compose the gallery**

Sections (all present in the registry today): buttons (every `variant` × two `size`s, plus `ButtonGroup`), chips and tags, form controls (`TextField`+`Input`, `Textarea`, `Checkbox`, `RadioGroup`+`Radio`, `Switch`, `SearchField`, `NumberField`), `Slider`, `SegmentedControl`, `Tabs`, feedback (`Alert` variants, `Spinner`, `Skeleton`, `EmptyState`), overlays-in-place (`Tooltip` on a `Button`, `Dropdown` as the select stand-in), a login `Card` (two `TextField`s + primary `Button` + `Link`), plus `Separator` between sections. Layout: a responsive grid (`grid gap-6 p-6 sm:grid-cols-2 xl:grid-cols-3`), each section in a bordered panel with a small English heading. Use the stories' JSX as the source of truth for every prop; import components from `@peakui/react` only.

One section written out as the pattern for the rest (variant/size names come from `button.stories.tsx` — the verified excerpt iterates `VARIANTS` and passes `size` the same way):

```tsx
function ButtonsSection() {
  return (
    <section className="flex flex-col gap-4 border border-border p-5">
      <h3 className="text-xs font-medium text-muted">Buttons</h3>
      {(["sm", "md"] as const).map((size) => (
        <div className="flex flex-wrap gap-2" key={size}>
          {VARIANTS.map((variant) => (
            <Button key={variant} size={size} variant={variant}>
              {variant}
            </Button>
          ))}
        </div>
      ))}
    </section>
  );
}
```

Import `VARIANTS` from the button module if it exports it; otherwise inline the variant list exactly as `button.stories.tsx` spells it. Compose every other section the same way: read the stories file, mirror its JSX, wrap in the section panel.

- [ ] **Step 2: Add the preset picker to the header**

A `Popover` listing `GALLERY` (name + a two-swatch preview: accent square on light/dark backgrounds built from `parseOklch(values.accent)` + `formatOklch`), each entry calling `set(preset.values)` and `matchGallery(values)` marking the active one; "Custom" is display-only (no entry).

- [ ] **Step 3: Verify in the browser**

`http://localhost:3000/en/themes`: every gallery section re-themes live; Spotify preset paints the gallery green and the header shows "Spotify"; editing any control flips the header to "Custom"; Graphite exercises `darkAccent` in the dark scheme.
Run: `pnpm --filter @peakui/docs test && pnpm --filter @peakui/docs typecheck` — Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/src/app/[lang]/themes/preview/ apps/docs/src/app/[lang]/themes/theme-builder.tsx
git commit -m "feat(docs): theme builder preview gallery and preset picker"
```

---

### Task 7: Navigation link, full verification, behavioral smoke

**Files:**
- Modify: `apps/docs/src/lib/dictionaries/en.json` (add `"themes": "Theme Builder"` inside `nav`)
- Modify: `apps/docs/src/app/[lang]/(home)/home-layout-links.tsx` (menu item + nav link)

**Interfaces:**
- Consumes: `dict.nav.themes` (same shape as `nav.components`).
- Produces: the docs site links to `/themes` from the home navigation.

- [ ] **Step 1: Add the dictionary entry and links**

In `en.json` `nav`: `"themes": "Theme Builder"`.
In `home-layout-links.tsx`, add to the `documentation` menu `items` and as a third top-level `on: "nav"` link (mirror the existing `components` entries):

```tsx
{
  icon: <Iconify icon="paint" />,
  text: nav.themes,
  url: "/themes",
},
```

Verify the icon name exists in `@iconify-json/gravity-ui` (`paint` is a gravity-ui icon; if it fails to resolve, pick another from the set — do not invent names).

- [ ] **Step 2: Run every gate**

```bash
pnpm --filter @peakui/styles test && pnpm --filter @peakui/styles check:tokens
pnpm --filter @peakui/docs test && pnpm --filter @peakui/docs typecheck && pnpm --filter @peakui/docs lint
pnpm typecheck && pnpm lint
```

Expected: all PASS, zero drift errors.

- [ ] **Step 3: Behavioral smoke via agent-browser**

With `pnpm dev:docs` running, `agent-browser open http://localhost:3000/en/themes` → `snapshot -i` → act on refs: move the hue slider → `snapshot --delta` shows the preview changed; switch scheme; select Spotify; open the code panel; copy. Then `errors` / `console` — Expected: no errors. A11y pass: `a11y` — no violations beyond pre-existing page-level ones (record any that appear).

- [ ] **Step 4: Commit**

```bash
git add apps/docs/src/lib/dictionaries/en.json "apps/docs/src/app/[lang]/(home)/home-layout-links.tsx"
git commit -m "feat(docs): link the theme builder from the site navigation"
```

- [ ] **Step 5: Wrap up**

Run `git log --oneline p2-wave..` — seven commits, one per task. Task summary must cite: the spec path, this plan path, the CodeGraph result quoted in the spec session, and the manual verification checklist results from Tasks 3–7.
