import {COMPONENT_PATH, COMPONENT_STYLES_PATH} from "@/utils/constants";

/** The `links` frontmatter field of a docs page; its schema lives in `source.config.ts`. */
export interface ComponentLinksType {
  /** Path of the React Aria documentation page, e.g. `Button`. */
  rac?: string;
  /** Path under `packages/react/src/components`, e.g. `button`. */
  source?: string;
  /** Path under `packages/styles/components`, e.g. `button.css`. */
  styles?: string;
}

/** Turns the frontmatter `links` into absolute URLs. */
export function generateComponentLinks(links: ComponentLinksType | null | undefined) {
  if (!links) return null;

  return {
    rac: links.rac ? `https://react-aria.adobe.com/${links.rac}` : undefined,
    source: links.source ? `${COMPONENT_PATH}/${links.source}` : undefined,
    styles: links.styles ? `${COMPONENT_STYLES_PATH}/${links.styles}` : undefined,
  };
}
