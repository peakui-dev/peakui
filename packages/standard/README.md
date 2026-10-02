# @peakui/standard

Shared ESLint and Prettier presets. Private — never published.

```js
// <package>/eslint.config.mjs
export {default} from "@peakui/standard/eslint/react.mjs";
```

```js
// prettier.config.mjs
export {default} from "@peakui/standard/prettier/base.mjs";
```

## Why there is no `exports` map

Without one, Node falls back to legacy subpath resolution and serves any file under the package. That
is what makes `@peakui/standard/eslint/react.mjs` resolve. The vendored reference relies on the same
thing. Adding an `exports` map would break every consumer unless each path were enumerated.

## Why the plugins are not dependencies here

They are devDependencies of the repository root, as in the reference. The presets `import` them and
pnpm resolves them from the root `node_modules`. If a plugin ever fails to resolve from a package that
consumes a preset, the fix is to declare it here rather than to duplicate it per package.

## The one deliberate difference from the reference

`@typescript-eslint/no-explicit-any` is **`"error"`** here; the reference sets it `"off"`. PeakUI
permits `any` in exactly one place — the polymorphic spread boundary of a `DOMRenderProps` component —
and requires an inline `eslint-disable-next-line` there. The lint rule is what keeps that exception one
line wide instead of a habit: the reference has 115 `as any` sites in library code because nothing
stops the next one. See `.agents/skills/peakui-component-standards/references/typescript.md`.
