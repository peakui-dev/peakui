import {cn} from "@/utils/cn";

/*
 * Colour roles, drawn from the tokens themselves. A plate is filled with `var(--<token>)` and
 * never with a colour value: the theme is generated (`pnpm tokens:build`), so a literal written
 * here would drift at the next build. What a plate cannot show — that a value is derived rather
 * than declared — is the `formula`, printed under it.
 *
 * Every plate also carries its token name as text, which is what keeps the page readable under
 * `forced-colors`, where the fill is overridden and colour alone says nothing.
 */

export interface ColorToken {
  /** Token name without the leading dashes: `accent`, `accent-hover`. */
  name: string;
  /** Token name of the readable partner, drawn as a glyph on this plate. */
  foreground?: string;
  /** How the value is derived, when it is: `color-mix(in oklab, var(--danger) 15%, transparent)`. */
  formula?: string;
  /** The Tailwind utility a consumer writes: `bg-accent`. */
  utility?: string;
}

export interface SoftTokens {
  base: ColorToken;
  foreground?: ColorToken;
  hover?: ColorToken;
}

interface ColorPlateProps {
  className?: string;
  token: ColorToken;
}

function ColorPlate({className, token}: ColorPlateProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div
        className="flex h-16 items-center justify-center rounded-lg border border-separator"
        data-slot="color-plate"
        style={{backgroundColor: `var(--${token.name})`}}
      >
        {token.foreground ? (
          <span className="text-sm font-medium" style={{color: `var(--${token.foreground})`}}>
            Aa
          </span>
        ) : null}
      </div>
      <code className="text-xs break-all">--{token.name}</code>
      {token.utility ? <code className="text-xs text-muted">{token.utility}</code> : null}
      {token.formula ? (
        <code className="text-[11px] text-muted break-all">{token.formula}</code>
      ) : null}
    </div>
  );
}

export interface ColorSectionStackedProps {
  tokens: ColorToken[];
}

/** A set of roles that stand on their own: text colours, background levels, borders. */
export function ColorSectionStacked({tokens}: ColorSectionStackedProps) {
  return (
    <div className="my-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {tokens.map((token) => (
        <ColorPlate key={token.name} token={token} />
      ))}
    </div>
  );
}

export interface ColorSectionSideBySideProps {
  base: ColorToken;
  foreground?: ColorToken;
  hover?: ColorToken;
  soft?: SoftTokens;
}

/**
 * One interactive role in full: its base with the foreground drawn on it, the foreground alone,
 * the hover value, and the soft tint beside them.
 */
export function ColorSectionSideBySide({
  base,
  foreground,
  hover,
  soft,
}: ColorSectionSideBySideProps) {
  const softTokens = soft
    ? [soft.base, soft.foreground, soft.hover].filter((token): token is ColorToken =>
        Boolean(token),
      )
    : [];

  return (
    <div className="my-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <ColorPlate token={foreground ? {...base, foreground: foreground.name} : base} />
      {foreground ? <ColorPlate token={foreground} /> : null}
      {hover ? <ColorPlate token={hover} /> : null}
      {softTokens.map((token) => (
        <ColorPlate key={token.name} token={token} />
      ))}
    </div>
  );
}

export interface ColorSectionFormFieldProps {
  background: ColorToken;
  border: ColorToken;
  borderFocus?: ColorToken;
  borderHover?: ColorToken;
  foreground: ColorToken;
  placeholder: ColorToken;
}

/**
 * The field tokens as a field: a reader checks `--field-placeholder` against
 * `--field-background` by looking at them together, not by reading two rows of a table.
 */
export function ColorSectionFormField({
  background,
  border,
  borderFocus,
  borderHover,
  foreground,
  placeholder,
}: ColorSectionFormFieldProps) {
  const outlines = [border, borderHover, borderFocus].filter((token): token is ColorToken =>
    Boolean(token),
  );

  return (
    <div className="my-6 flex flex-col gap-4">
      <div
        className="flex flex-col gap-2 rounded-field p-4"
        data-slot="color-plate"
        style={{backgroundColor: `var(--${background.name})`}}
      >
        <span className="text-sm" style={{color: `var(--${foreground.name})`}}>
          A value a person typed
        </span>
        <span className="text-sm" style={{color: `var(--${placeholder.name})`}}>
          The placeholder behind it
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ColorPlate token={background} />
        <ColorPlate token={foreground} />
        <ColorPlate token={placeholder} />
        {outlines.map((token) => (
          <ColorPlate key={token.name} token={token} />
        ))}
      </div>
    </div>
  );
}
