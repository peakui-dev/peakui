"use client";

import type {GalleryPreset} from "@/app/[lang]/themes/presets";
import type {Scheme} from "@peakui/styles/generator";

import {Chip, SegmentedControl, Switch} from "@peakui/react";
import {buttonVariants} from "@peakui/styles";
import {deriveTheme, emitVariablesCss} from "@peakui/styles/generator";
import LinkRoot from "fumadocs-core/link";
import {useMemo, useState, useSyncExternalStore} from "react";

import {PresetPicker} from "@/app/[lang]/themes/preset-picker";
import {DEFAULT_VALUES, toPreset} from "@/app/[lang]/themes/presets";
import {ThemePreview} from "@/app/[lang]/themes/theme-preview";
import {encodeBuilderState} from "@/app/[lang]/themes/url-codec";
import {WorkspaceCard} from "@/components/demo/workspace-card";

/*
 * The site's scheme, read from the class next-themes keeps on <html>. An external store, so
 * the server render and hydration agree on "light" and the real value arrives right after.
 */
const subscribeToScheme = (onChange: () => void): (() => void) => {
  const observer = new MutationObserver(onChange);

  observer.observe(document.documentElement, {attributeFilter: ["class"], attributes: true});

  return () => observer.disconnect();
};

const readScheme = (): Scheme =>
  document.documentElement.classList.contains("dark") ? "dark" : "light";

/*
 * On the accent block the buttons are drawn from the same pair the block is — the accent and
 * the text the engine puts on it — swapped for the filled one, so they hold their contrast in
 * every preset. The focus ring takes that text colour too: the theme's own ring is the accent.
 */
const ON_ACCENT_FILLED =
  "[--button-bg:var(--color-accent-foreground)] [--button-bg-hover:var(--color-accent-foreground)] [--button-bg-pressed:var(--color-accent-foreground)] [--button-fg:var(--color-accent)] hover:opacity-90";
const ON_ACCENT_OUTLINE =
  "[--button-border:color-mix(in_oklab,var(--color-accent-foreground)_45%,transparent)] [--button-bg-hover:color-mix(in_oklab,var(--color-accent-foreground)_14%,transparent)] [--button-bg-pressed:color-mix(in_oklab,var(--color-accent-foreground)_14%,transparent)] [--button-fg:var(--color-accent-foreground)]";

export interface HomeHeroCopy {
  title: string;
  description: string;
  getStarted: string;
  viewComponents: string;
  brands: {title: string; hint: string; openBuilder: string};
}

/*
 * The page's thesis as one plate, in the idiom of the theme builder: the claim set large on
 * the accent, a composed scene beside it, and the presets under both. Picking a preset mounts
 * its theme for the whole document — the navigation and every section below included — which
 * is the claim, demonstrated. The default preset mounts nothing: it is the site's own theme.
 */
export function HomeHero({copy, version}: {copy: HomeHeroCopy; version: string}) {
  const [preset, setPreset] = useState<GalleryPreset | null>(null);
  const scheme = useSyncExternalStore(subscribeToScheme, readScheme, (): Scheme => "light");
  const values = preset?.values ?? DEFAULT_VALUES;

  const themeCss = useMemo(() => {
    if (!preset || preset.name === "Default") return null;

    const themePreset = toPreset(preset.values, preset.semanticOverrides);

    return emitVariablesCss(themePreset, deriveTheme(themePreset));
  }, [preset]);

  // The builder opens on the same values, in the scheme the visitor is looking at.
  const builderQuery = new URLSearchParams(encodeBuilderState({...values, scheme})).toString();

  return (
    <section className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-separator bg-separator lg:grid-cols-2">
      {/* Out of the grid's flow: the stylesheet it carries applies from a hidden box all the same. */}
      {themeCss !== null && (
        <div className="hidden">
          <ThemePreview css={themeCss} scheme={scheme}>
            {null}
          </ThemePreview>
        </div>
      )}
      <div className="flex flex-col justify-between gap-16 bg-accent p-6 text-accent-foreground [--focus:var(--accent-foreground)] sm:p-10">
        <p className="font-mono text-xs">@peakui/react {version}</p>
        <div className="flex flex-col items-start gap-6">
          <h1 className="text-[clamp(2.5rem,5.4vw,4.5rem)] leading-[0.95] font-semibold tracking-[-0.04em] text-balance">
            {copy.title}
          </h1>
          <p className="max-w-[46ch] text-base leading-relaxed sm:text-lg">{copy.description}</p>
          <div className="flex flex-wrap gap-3">
            <LinkRoot
              className={buttonVariants({class: ON_ACCENT_FILLED, size: "lg", variant: "primary"})}
              href="/docs/react/getting-started"
            >
              {copy.getStarted}
            </LinkRoot>
            <LinkRoot
              className={buttonVariants({class: ON_ACCENT_OUTLINE, size: "lg", variant: "outline"})}
              href="/docs/react/components"
            >
              {copy.viewComponents}
            </LinkRoot>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center gap-5 bg-background p-3 sm:p-8">
        <WorkspaceCard />
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-1">
          <SegmentedControl aria-label="View" defaultSelectedKey="grid" size="sm">
            <SegmentedControl.Item id="grid">Grid</SegmentedControl.Item>
            <SegmentedControl.Item id="list">List</SegmentedControl.Item>
            <SegmentedControl.Item id="table">Table</SegmentedControl.Item>
          </SegmentedControl>
          <div className="flex items-center gap-2">
            <Chip color="accent" variant="soft">
              New
            </Chip>
            <Chip color="success" variant="soft">
              Stable
            </Chip>
            <Chip color="warning" variant="soft">
              Beta
            </Chip>
          </div>
          <Switch defaultSelected>
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              Public
            </Switch.Content>
          </Switch>
        </div>
      </div>
      <div className="flex flex-col gap-5 bg-background p-6 sm:px-10 lg:col-span-2 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {copy.brands.title}
          </h2>
          <p className="text-sm text-muted">{copy.brands.hint}</p>
        </div>
        <PresetPicker
          activeName={preset?.name ?? "Default"}
          className="-mx-2 grid grid-cols-4 sm:grid-cols-8 lg:mx-0"
          scheme={scheme}
          onSelect={setPreset}
        />
        <LinkRoot
          className="text-sm font-medium text-foreground underline decoration-separator-tertiary underline-offset-4 hover:decoration-current"
          href={builderQuery ? `/themes?${builderQuery}` : "/themes"}
        >
          {copy.brands.openBuilder}
        </LinkRoot>
      </div>
    </section>
  );
}
