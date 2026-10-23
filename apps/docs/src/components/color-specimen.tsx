/*
 * A colour role, shown twice: once in each shipped theme, side by side.
 *
 * Both halves are ordinary subtrees carrying `data-theme`, which is how this library scopes a
 * theme to a region — so the specimen is the running theme rather than a picture of it, and a
 * token renamed by `pnpm tokens:build` goes blank here instead of going stale.
 *
 * A pair is proved, not asserted: a fill band writes its own token name in the foreground it
 * pairs with, on the background it pairs with. If a pair is illegible, the page says so by being
 * illegible in that one band.
 */

const THEMES = [
  {label: "light", name: "default-light"},
  {label: "dark", name: "default-dark"},
] as const;

export interface ColorBand {
  /** Token name without the leading dashes: `accent`, `accent-hover`. */
  name: string;
  /** Token name of the readable partner, written on the band. Fill bands only. */
  foreground?: string;
  /** A surface to put content on, text drawn in the colour, or a rule. Defaults to `fill`. */
  kind?: "fill" | "ink" | "line";
}

export interface ColorSpecimenProps {
  /** The variants of one role, in the order a reader meets them. */
  bands: ColorBand[];
  /** The role name, written once. */
  label: string;
  /** The utilities a reader types for this role: `bg-accent`, `text-accent-foreground`. */
  utilities?: string[];
}

/*
 * The token name is set in the mono face but not in a `code` element: the docs give inline code
 * a border and a background of their own, and that box drawn on top of a colour band would be a
 * second surface inside the one the band exists to show.
 */
const TOKEN = "font-mono text-xs";

function Band({band}: {band: ColorBand}) {
  const token = `--${band.name}`;

  if (band.kind === "line") {
    return (
      <div className="flex items-baseline gap-3" data-slot="color-band">
        <span className={`${TOKEN} w-44 shrink-0 text-muted`}>{token}</span>
        {/*
         * A div, not an `hr`: this rule is a sample of a border colour, not a thematic break in
         * the document — and the docs' prose gives an `hr` a 48px margin that no utility outranks.
         */}
        <div className="min-w-8 flex-1 border-t-2" style={{borderColor: `var(${token})`}} />
      </div>
    );
  }

  if (band.kind === "ink") {
    return (
      <div className="py-1" data-slot="color-band">
        <span className={TOKEN} style={{color: `var(${token})`}}>
          {token}
        </span>
      </div>
    );
  }

  return (
    <div
      /*
       * The hairline is the theme's own separator, resolved inside this pane. Without it a role
       * that matches the page — `--default` in the light theme, `--field-background` — would have
       * no visible extent, and the band would read as missing rather than as pale.
       */
      className="flex items-center justify-between gap-3 rounded-lg border border-separator px-3 py-2.5"
      data-slot="color-band"
      style={{
        backgroundColor: `var(${token})`,
        color: `var(--${band.foreground ?? "foreground"})`,
      }}
    >
      <span className="text-sm">Aa</span>
      <span className={TOKEN}>{token}</span>
    </div>
  );
}

/**
 * One role, in both themes. The page chrome stays neutral: every saturated pixel inside the
 * frame belongs to the role being documented.
 */
export function ColorSpecimen({bands, label, utilities}: ColorSpecimenProps) {
  return (
    <figure className="my-6 overflow-hidden rounded-xl border border-separator">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-separator bg-surface px-4 py-2.5">
        <span className="text-sm font-medium text-surface-foreground">{label}</span>
        <span className="flex flex-wrap gap-3">
          {utilities?.map((utility) => (
            <code key={utility} className="text-xs text-muted">
              {utility}
            </code>
          ))}
        </span>
      </figcaption>
      <div className="grid gap-px bg-separator sm:grid-cols-2">
        {THEMES.map((theme) => (
          <div
            key={theme.name}
            className="flex flex-col gap-1.5 p-4"
            data-theme={theme.name}
            style={{backgroundColor: "var(--background)"}}
          >
            <span className="text-xs" style={{color: "var(--muted)"}}>
              {theme.label}
            </span>
            {bands.map((band) => (
              <Band key={band.name} band={band} />
            ))}
          </div>
        ))}
      </div>
    </figure>
  );
}
