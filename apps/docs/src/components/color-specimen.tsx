/*
 * A colour role, shown twice: once in each shipped theme, side by side.
 *
 * Both halves are ordinary subtrees carrying `data-theme`, which is how this library scopes a
 * theme to a region — so the specimen is the running theme rather than a picture of it, and a
 * token renamed by `pnpm tokens:build` goes blank here instead of going stale.
 *
 * Layers nest because the roles nest. A hover state replaces the surface it is drawn on, a
 * foreground is content on that surface, `-secondary` and `-tertiary` exist for containers inside
 * containers, a scrollbar thumb rides its track. Drawing one inside the other is not decoration:
 * it is the relationship the tokens are named for.
 *
 * A pair is proved rather than asserted. The token name on a fill is written in the foreground it
 * pairs with — so an illegible pair is illegible here, in the one place it should be.
 */

const THEMES = [
  {label: "light", name: "default-light"},
  {label: "dark", name: "default-dark"},
] as const;

/*
 * With no outline on a layer, the inset is what says one colour is on top of another: a generous
 * step at the outside, tightening as the nesting deepens. A border would draw a line that belongs
 * to no token and would read as the edge of the colour rather than as the colour's extent.
 */
const PADDING = ["p-5", "p-4", "p-3"] as const;

const TOKEN = "font-mono text-xs";

export interface ColorLayer {
  /** Token name without the leading dashes: `accent`, `accent-hover`. */
  name: string;
  /** Token of the text drawn on this layer — the pair being proved. */
  foreground?: string;
  /** A filled surface, text drawn in the colour, or a rule. Defaults to `fill`. */
  kind?: "fill" | "ink" | "line";
  /** Layers drawn on top of this one, because that is where they appear in a UI. */
  layers?: ColorLayer[];
  /** What a translucent layer is stacked over. Drawn underneath, and named. */
  over?: string;
}

export interface ColorSpecimenProps {
  /** The role's name, written once. */
  label: string;
  /** The role's layers, outermost first. */
  layers: ColorLayer[];
  /** The utilities a reader types for this role: `bg-accent`, `text-accent-foreground`. */
  utilities?: string[];
}

function Layer({depth, layer}: {depth: number; layer: ColorLayer}) {
  const token = `--${layer.name}`;

  if (layer.kind === "line") {
    return (
      <div className="flex items-baseline gap-3" data-slot="color-layer" data-token={layer.name}>
        <span className={`${TOKEN} w-44 shrink-0 text-muted`}>{token}</span>
        <div
          className="min-w-8 flex-1 border-t-2"
          data-slot="color-rule"
          style={{borderColor: `var(${token})`}}
        />
      </div>
    );
  }

  if (layer.kind === "ink") {
    return (
      <span
        className={`${TOKEN} block`}
        data-slot="color-layer"
        data-token={layer.name}
        style={{color: `var(${token})`}}
      >
        {token}
      </span>
    );
  }

  const fill = (
    <div
      className={`relative rounded-lg ${PADDING[depth] ?? "p-2.5"}`}
      data-slot="color-layer"
      data-token={layer.name}
      style={{
        backgroundColor: `var(${token})`,
        color: layer.foreground ? `var(--${layer.foreground})` : undefined,
      }}
    >
      {/*
       * The token name is the whole label: written in the foreground it pairs with, at the size
       * small text is judged at, it is the legibility proof. A specimen glyph beside it would
       * repeat that in a larger size, which is the easier test.
       */}
      {/* Medium weight marks the layer's own name apart from the tokens written on it. */}
      <span className={`${TOKEN} block font-medium`}>
        {token}
        {layer.over ? <span className="font-normal opacity-60"> over --{layer.over}</span> : null}
      </span>
      {layer.layers?.length ? (
        <div className="mt-2 flex flex-col gap-2">
          {layer.layers.map((child) => (
            <Layer key={child.name} depth={depth + 1} layer={child} />
          ))}
        </div>
      ) : null}
    </div>
  );

  /*
   * A translucent role has to be seen through: without an opaque layer beneath it, the pane's own
   * background would stand in for whatever the tint is meant to sit on, and the tint would read
   * as a flat colour it is not.
   */
  if (!layer.over) return fill;

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div
        className="absolute inset-0"
        data-slot="color-underlay"
        style={{backgroundColor: `var(--${layer.over})`}}
      />
      {fill}
    </div>
  );
}

/**
 * One role, in both themes. The page chrome stays neutral: every saturated pixel inside the
 * frame belongs to the role being documented.
 */
export function ColorSpecimen({label, layers, utilities}: ColorSpecimenProps) {
  return (
    <figure aria-label={label} className="my-6">
      {/*
       * No frame and no header bar: the role's name is the heading above, and a bar of the docs'
       * own surface would put a colour in the specimen that the specimen is not about. The two
       * themes meet on a hairline, which is the only chrome left.
       */}
      <div className="grid gap-px overflow-hidden rounded-xl bg-separator sm:grid-cols-2">
        {THEMES.map((theme) => (
          <div
            key={theme.name}
            className="flex flex-col gap-3 p-4"
            data-theme={theme.name}
            style={{backgroundColor: "var(--background)"}}
          >
            <span className={`${TOKEN} opacity-60`} style={{color: "var(--foreground)"}}>
              {theme.label}
            </span>
            {layers.map((layer) => (
              <Layer key={layer.name} depth={0} layer={layer} />
            ))}
          </div>
        ))}
      </div>
      {utilities?.length ? (
        <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted">
          {utilities.map((utility) => (
            <span key={utility}>{utility}</span>
          ))}
        </figcaption>
      ) : null}
    </figure>
  );
}
