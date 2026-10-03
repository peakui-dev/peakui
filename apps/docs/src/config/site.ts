import {GITHUB_URL, RAW_DOCS_CONTENT_PATH, REPO_NAME} from "@/utils/constants";
import {__BASE_URL__} from "@/utils/env";

export const siteConfig = {
  description:
    "Accessible React components built on React Aria Components and Tailwind CSS v4, styled with BEM classes and CSS custom properties.",
  fullName: "PeakUI - Accessible React components, styled with plain CSS.",
  githubRawUrl: RAW_DOCS_CONTENT_PATH,
  githubUrl: `${GITHUB_URL}/${REPO_NAME}`,
  name: "PeakUI",
  siteUrl: __BASE_URL__,
};

export type SiteConfig = typeof siteConfig;
