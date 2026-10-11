// @vitest-environment jsdom
import type {Root} from "react-dom/client";

import {deriveTheme, emitVariablesCss} from "@peakui/styles/generator";
import {act} from "react";
import {createRoot} from "react-dom/client";
import {afterAll, beforeAll, describe, expect, it} from "vitest";

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

  it("mounts the standard theme css and puts <html> on the scheme", async () => {
    const preset = toPreset(DEFAULT_VALUES);
    const css = emitVariablesCss(preset, deriveTheme(preset));

    await act(async () => {
      root.render(
        <ThemePreview css={css} scheme="dark">
          <p>page content</p>
        </ThemePreview>,
      );
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("builder-dark");
    expect(document.documentElement.classList.contains("builder-dark")).toBe(true);
    expect(host.querySelector("style")?.textContent).toContain(":root,");
    expect(host.querySelector("style")?.textContent).toContain('[data-theme="builder-dark"]');
    expect(host.textContent).toContain("page content");

    await act(async () => {
      root.render(
        <ThemePreview css={css} scheme="light">
          <p>page content</p>
        </ThemePreview>,
      );
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("builder-light");

    await act(async () => {
      root.render(null);
    });

    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    expect(document.documentElement.classList.contains("builder-light")).toBe(false);
  });
});
