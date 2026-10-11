import type {Metadata} from "next";

import {ThemeBuilder} from "./theme-builder";

export const metadata: Metadata = {
  description:
    "Tune a PeakUI theme — accent, neutrals, radii — with the whole page as a live preview, then export CSS or a preset.",
  title: "Theme Builder",
};

export default function ThemesPage() {
  return <ThemeBuilder />;
}
