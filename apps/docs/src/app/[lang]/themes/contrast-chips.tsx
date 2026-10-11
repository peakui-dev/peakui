"use client";

import type {ContrastFix} from "@peakui/styles/generator";

import {Chip} from "@peakui/react";

/*
 * Transparency, not warnings: the engine guarantees contrast, and these chips show what it
 * adjusted to keep the guarantee (the spec's differentiator). The engine reports fixes per
 * scheme, so an identical adjustment can arrive twice — one chip per distinct fix.
 */
export function ContrastChips({fixes}: {fixes: ContrastFix[]}) {
  const unique = [
    ...new Map(fixes.map((fix) => [`${fix.token}|${fix.from}|${fix.to}`, fix])).values(),
  ];

  if (unique.length === 0) return null;

  return (
    <div aria-label="Contrast adjustments made by the engine" className="flex flex-wrap gap-2">
      {unique.map((fix) => (
        <Chip key={`${fix.token}-${fix.from}-${fix.to}`}>
          {fix.token}: L {fix.from.toFixed(2)} → {fix.to.toFixed(2)}
        </Chip>
      ))}
    </div>
  );
}
