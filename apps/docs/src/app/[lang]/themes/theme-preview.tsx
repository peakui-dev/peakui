"use client";

import type {Scheme} from "@peakui/styles/generator";
import type {ReactNode} from "react";

import {useEffect} from "react";

/**
 * Mounts the generated theme for the whole page and keeps <html> on its scheme.
 *
 * The injected stylesheet is exactly what a shipped theme's variables.css is: `:root` carries
 * the light scheme, `.builder-dark` / `[data-theme="builder-dark"]` the dark one, and setting
 * the attribute on <html> themes the document — header, gutters and controls included. The
 * cleanup returns the site to its own theme before any other page renders.
 */
export function ThemePreview({
  children,
  css,
  scheme,
}: {
  children: ReactNode;
  css: string;
  scheme: Scheme;
}) {
  useEffect(() => {
    const root = document.documentElement;
    const name = `builder-${scheme}`;

    root.setAttribute("data-theme", name);
    root.classList.add(name);

    return () => {
      root.removeAttribute("data-theme");
      root.classList.remove("builder-light", "builder-dark");
    };
  }, [scheme]);

  return (
    <div>
      <style dangerouslySetInnerHTML={{__html: css}} />
      {children}
    </div>
  );
}
