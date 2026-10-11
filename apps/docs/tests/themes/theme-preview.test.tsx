// @vitest-environment jsdom
import {act} from "react";
import {createRoot, type Root} from "react-dom/client";
import {afterAll, beforeAll, describe, expect, it} from "vitest";

import {deriveTheme, emitVariablesCss} from "@peakui/styles/generator";

import {DEFAULT_VALUES, toPreset} from "@/app/[lang]/themes/presets";
import {ThemePreview} from "@/app/[lang]/themes/theme-preview";

(globalThis as {IS_REACT_ACT_ENVIRONMENT?: boolean}).IS_REACT_ACT_ENVIRONMENT = true;

describe("ThemePreview", () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterAll(() => {
    root.unmount();
    host.remove();
  });

  it("applies the scoped css and the scheme attribute to the preview container", async () => {
    const preset = toPreset(DEFAULT_VALUES);
    const css = emitVariablesCss(preset, deriveTheme(preset), {scope: "#tb-preview"});

    await act(async () => {
      root.render(
        <ThemePreview css={css} scheme="dark">
          <p>preview content</p>
        </ThemePreview>,
      );
    });

    const container = host.querySelector("#tb-preview")!;

    expect(container.getAttribute("data-theme")).toBe("builder-dark");
    expect(container.querySelector("style")?.textContent).toContain(
      '#tb-preview[data-theme="builder-dark"]',
    );
    expect(container.textContent).toContain("preview content");
  });
});
