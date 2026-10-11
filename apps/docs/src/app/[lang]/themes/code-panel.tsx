"use client";

import type {BuilderValues} from "./presets";
import type {ThemePreset, deriveTheme} from "@peakui/styles/generator";

import {Button, Input, Label, SegmentedControl, TextField} from "@peakui/react";
import {emitVariablesCss} from "@peakui/styles/generator";
import {useDeferredValue, useEffect, useMemo, useState} from "react";

import {toPreset} from "./presets";

type Derived = ReturnType<typeof deriveTheme>;
type SemanticOverrides = ThemePreset["semanticOverrides"];

export function slugifyThemeId(raw: string): string {
  const slug = raw
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");

  return slug || "custom";
}

export function buildExportCss(
  id: string,
  values: BuilderValues,
  derived: Derived,
  semanticOverrides?: SemanticOverrides,
): string {
  const usage = [
    `/* PeakUI theme "${id}".`,
    `   Import this file after @peakui/styles, then set data-theme="${id}-light"`,
    `   (or data-theme="${id}-dark") on the root element. */`,
  ].join("\n");

  return `${usage}\n${emitVariablesCss(toPreset(values, semanticOverrides, id), derived)}`;
}

export function buildExportPreset(
  id: string,
  values: BuilderValues,
  semanticOverrides?: SemanticOverrides,
): string {
  const name = `${id.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())}Preset`;

  return [
    `import type {ThemePreset} from "@peakui/styles/generator";`,
    ``,
    `export const ${name}: ThemePreset = ${JSON.stringify(
      toPreset(values, semanticOverrides, id),
      null,
      2,
    )};`,
  ].join("\n");
}

function download(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], {type: "text/plain"}));
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

const TABS: ["css" | "preset", string][] = [
  ["css", "CSS"],
  ["preset", "Preset"],
];

export function CodePanel({
  derived,
  onClose,
  semanticOverrides,
  values,
}: {
  onClose: () => void;
  values: BuilderValues;
  derived: Derived;
  semanticOverrides?: SemanticOverrides;
}) {
  const [name, setName] = useState("custom");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const [tab, setTab] = useState<"css" | "preset">("css");
  const id = slugifyThemeId(name);

  const {accent, darkAccent, formRadius, grayChroma, radius} = values;
  const content = useDeferredValue(
    useMemo(() => {
      const snapshot = {accent, grayChroma, radius, formRadius, darkAccent};

      return tab === "css"
        ? buildExportCss(id, snapshot, derived, semanticOverrides)
        : buildExportPreset(id, snapshot, semanticOverrides);
    }, [tab, id, accent, grayChroma, radius, formRadius, darkAccent, derived, semanticOverrides]),
  );

  return (
    <aside
      aria-label="Export panel"
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col gap-4 border-l border-separator bg-surface p-6 shadow-overlay"
    >
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium text-foreground">Export</h2>
        <Button isIconOnly aria-label="Close export panel" variant="ghost" onPress={onClose}>
          ✕
        </Button>
      </div>
      <TextField className="w-full" value={name} onChange={setName}>
        <Label>Theme name</Label>
        <Input placeholder="custom" type="text" />
      </TextField>
      <SegmentedControl
        aria-label="Export format"
        selectedKey={tab}
        size="md"
        onSelectionChange={(key) => setTab(key as "css" | "preset")}
      >
        {TABS.map(([key, label]) => (
          <SegmentedControl.Item key={key} id={key}>
            {label}
          </SegmentedControl.Item>
        ))}
      </SegmentedControl>
      <pre className="min-h-0 flex-1 overflow-auto rounded-field bg-default p-3 text-xs text-foreground">
        {content}
      </pre>
      <div className="flex gap-2">
        <Button variant="secondary" onPress={() => navigator.clipboard?.writeText(content)}>
          Copy
        </Button>
        <Button
          variant="primary"
          onPress={() =>
            download(tab === "css" ? `${id}-variables.css` : `${id}-preset.ts`, content)
          }
        >
          Download
        </Button>
      </div>
    </aside>
  );
}
