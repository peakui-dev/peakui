"use client";

import type {BuilderValues} from "./presets";

import {deriveTheme, emitVariablesCss} from "@peakui/styles/generator";
import {useDeferredValue, useMemo, useState} from "react";

import {Button, Label, SegmentedControl, TextField, Input} from "@peakui/react";

import {toPreset} from "./presets";

type Derived = ReturnType<typeof deriveTheme>;

export function slugifyThemeId(raw: string): string {
  const slug = raw.toLowerCase().replaceAll(/[^a-z0-9-]+/g, "-").replaceAll(/^-+|-+$/g, "");

  return slug || "custom";
}

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
  onClose,
  values,
  derived,
}: {
  onClose: () => void;
  values: BuilderValues;
  derived: Derived;
}) {
  const [name, setName] = useState("custom");
  const [tab, setTab] = useState<"css" | "preset">("css");
  const id = slugifyThemeId(name);

  const content = useDeferredValue(
    useMemo(
      () => (tab === "css" ? buildExportCss(id, values, derived) : buildExportPreset(id, values)),
      [tab, id, values, derived],
    ),
  );

  return (
    <aside
      aria-label="Export panel"
      className="flex w-full max-w-md flex-col gap-4 border-l border-separator bg-surface p-4"
    >
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium text-foreground">Export</h2>
        <Button isIconOnly aria-label="Close export panel" onPress={onClose} variant="ghost">
          ✕
        </Button>
      </div>
      <TextField className="w-full" onChange={setName} value={name}>
        <Label>Theme name</Label>
        <Input placeholder="custom" type="text" />
      </TextField>
      <SegmentedControl
        aria-label="Export format"
        onSelectionChange={(key) => setTab(key as "css" | "preset")}
        selectedKey={tab}
        size="md"
      >
        {TABS.map(([key, label]) => (
          <SegmentedControl.Item id={key} key={key}>
            {label}
          </SegmentedControl.Item>
        ))}
      </SegmentedControl>
      <pre className="min-h-0 flex-1 overflow-auto rounded-field bg-default p-3 text-xs text-foreground">
        {content}
      </pre>
      <div className="flex gap-2">
        <Button onPress={() => navigator.clipboard?.writeText(content)} variant="secondary">
          Copy
        </Button>
        <Button
          onPress={() =>
            download(
              tab === "css" ? `${id}-variables.css` : `${id}-preset.ts`,
              content,
            )
          }
          variant="primary"
        >
          Download
        </Button>
      </div>
    </aside>
  );
}
