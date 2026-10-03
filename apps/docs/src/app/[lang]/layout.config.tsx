import type {BaseLayoutProps} from "fumadocs-ui/layouts/shared";

import {PeakUILogo} from "@/components/peakui-logo";

export {getHomeLayoutLinks} from "./(home)/home-layout-links";

/**
 * Shared layout configuration.
 *
 * Each layout adds its own options on top:
 * Home layout: app/[lang]/(home)/layout.tsx
 * Docs layout: app/[lang]/docs/[[...slug]]/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
  nav: {
    title: <PeakUILogo />,
    transparentMode: "always",
  },
};
