import type {NextConfig} from "next";

import {createMDX} from "fumadocs-mdx/next";

const withMDX = createMDX();

const noindexHeaders = [{key: "X-Robots-Tag", value: "noindex, nofollow"}];

// Routes written for machines: served, but kept out of search indexes.
const machineOnlyPaths = [
  "/:path*.md",
  "/:path*.mdx",
  "/llms.mdx/:path*",
  "/llms.txt",
  "/llms-components.txt",
  "/llms-patterns.txt",
  "/api/components",
];

const config: NextConfig = {
  compress: true,
  experimental: {
    optimizePackageImports: [
      "@peakui/react",
      "@gravity-ui/icons",
      "fumadocs-ui",
      "fumadocs-core",
      "react-aria-components",
    ],
  },
  async headers() {
    return machineOnlyPaths.map((source) => ({headers: noindexHeaders, source}));
  },
  reactStrictMode: true,
  async redirects() {
    return [
      {
        destination: "/:lang/docs/react/getting-started",
        permanent: false,
        source: "/:lang(en)/docs",
      },
      {
        destination: "/:lang/docs/react/getting-started",
        permanent: false,
        source: "/:lang(en)/docs/react",
      },
    ];
  },
  async rewrites() {
    // Per-page markdown: `<page url>.md` (and `.mdx`), with or without the locale prefix.
    return [
      {destination: "/llms.mdx/:lang/:path*", source: "/:lang(en)/docs/:path*.md"},
      {destination: "/llms.mdx/:lang/:path*", source: "/:lang(en)/docs/:path*.mdx"},
      {destination: "/llms.mdx/:path*", source: "/docs/:path*.md"},
      {destination: "/llms.mdx/:path*", source: "/docs/:path*.mdx"},
    ];
  },
  trailingSlash: false,
  // Both packages are consumed from source inside the workspace: their `exports` point at `src`.
  transpilePackages: ["@peakui/react", "@peakui/styles"],
};

export default withMDX(config);
