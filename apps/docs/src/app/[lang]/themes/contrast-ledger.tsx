"use client";

import type {MeasuredPair} from "./contrast-pairs";
import type {ContrastFix, TokenSet} from "@peakui/styles/generator";
import type {CSSProperties} from "react";

import {Button, Disclosure} from "@peakui/react";

import {measureContrast} from "./contrast-pairs";

const sample = (pair: MeasuredPair): CSSProperties =>
  pair.kind === "ring"
    ? {background: `var(--${pair.bg})`, boxShadow: `inset 0 0 0 2px var(--${pair.fg})`}
    : {background: `var(--${pair.bg})`, color: `var(--${pair.fg})`};

const ratio = (pair: MeasuredPair): string => `${pair.ratio.toFixed(1)}:1`;

/*
 * Transparency, not warnings: the engine guarantees contrast, so the ledger shows the pairs it
 * holds — as one strip of live samples — and keeps the ratios and what it moved to hold them one
 * click away (the spec's differentiator). The engine reports fixes per scheme, so an identical
 * adjustment can arrive twice — one line per distinct fix.
 */
export function ContrastLedger({fixes, tokens}: {fixes: ContrastFix[]; tokens: TokenSet}) {
  const pairs = measureContrast(tokens);
  const unique = [
    ...new Map(fixes.map((fix) => [`${fix.token}|${fix.from}|${fix.to}`, fix])).values(),
  ];

  return (
    <div className="flex flex-col gap-3">
      <div aria-hidden="true" className="flex gap-1.5">
        {pairs.map((pair) => (
          <span
            key={pair.label}
            className="flex h-8 flex-1 items-center justify-center rounded-md border border-separator text-xs font-semibold"
            style={sample(pair)}
            title={`${pair.label} ${ratio(pair)}`}
          >
            {pair.kind === "text" ? "Aa" : null}
          </span>
        ))}
      </div>
      <p className="text-xs leading-snug text-muted">
        Text holds 4.5:1 and the focus ring 3:1 in both schemes.
      </p>
      <Disclosure>
        <Disclosure.Heading>
          <Button className="-mx-2 font-normal text-muted" size="sm" slot="trigger" variant="ghost">
            Ratios and adjustments
            <Disclosure.Indicator />
          </Button>
        </Disclosure.Heading>
        <Disclosure.Content>
          <Disclosure.Body className="flex flex-col gap-3 pt-3">
            <ul className="flex flex-col gap-1.5">
              {pairs.map((pair) => (
                <li key={pair.label} className="flex justify-between gap-3 text-[13px]">
                  <span className="text-muted">{pair.label}</span>
                  <span className="tabular-nums">{ratio(pair)}</span>
                </li>
              ))}
            </ul>
            {unique.length > 0 && (
              <div
                aria-label="Contrast adjustments made by the engine"
                className="flex flex-col gap-1.5 rounded-lg bg-default p-3"
                role="group"
              >
                <p className="text-xs text-muted">
                  To hold them, the engine shifted the lightness of {unique.length}{" "}
                  {unique.length === 1 ? "token" : "tokens"}:
                </p>
                <ul className="flex flex-col gap-0.5 font-mono text-[11px] text-default-foreground">
                  {unique.map((fix) => (
                    <li
                      key={`${fix.token}-${fix.from}-${fix.to}`}
                      className="flex justify-between gap-3"
                    >
                      <span className="truncate">{fix.token}</span>
                      <span className="shrink-0 tabular-nums">
                        {fix.from.toFixed(2)} → {fix.to.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
    </div>
  );
}
