import type {Metadata} from "next";

import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import {dirname, join} from "node:path";

import {ThemeBuilder} from "./theme-builder";
import {extractThemeDerivations} from "./theme-derivations";

export const metadata: Metadata = {
  description:
    "Tune a PeakUI theme — accent, neutrals, radii — with a live preview, then export CSS or a preset.",
  title: "Theme Builder",
};

/*
 * Read once at render (the page is static, so at build). The shared theme's derived mappings
 * (`--radius-3xl: calc(var(--radius) * 3)` and friends) are substituted on `:root` where they
 * are declared, so an embedded theme must re-declare them on its scope to recompute — see
 * theme-derivations.ts. Resolving from process.cwd() (the app root in dev, build and start)
 * instead of import.meta.url: the bundler rewrites module URLs to virtual paths.
 */
const require = createRequire(join(process.cwd(), "package.json"));
const stylesPackage = "@peakui/styles";
const packageRoot = dirname(require.resolve(`${stylesPackage}/package.json`));
const themeDerivations = extractThemeDerivations(
  readFileSync(join(packageRoot, "themes", "shared", "theme.css"), "utf8"),
);

export default function ThemesPage() {
  return <ThemeBuilder themeDerivations={themeDerivations} />;
}
