import {bindings, defineConfig, defineWorker} from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "peakui-docs",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-12",
    compatibilityFlags: ["nodejs_compat"],
    // Default per @cloudflare/config, declared because the deploy's contract smoke runs
    // against `peakui-docs.<subdomain>.workers.dev` until the custom domain is attached.
    workersDev: true,
    // Worker-first only where an asset must not be served directly: the private prerender
    // cache under /_vinext/static-cache (the scope vinext's own scaffolding writes). Page
    // URLs carry no matching asset — with notFoundHandling "none" they fall through to the
    // Worker anyway, so the markdown negotiation in proxy.ts still runs. A global `true`
    // here routed /_next/static/* into the app router, where the root catch-all
    // /:lang/:rest+ matched it and the render threw (Cloudflare 1101) on every static file.
    assets: {notFoundHandling: "none", runWorkerFirst: ["/_vinext/static-cache/*"]},
    env: {
      ASSETS: bindings.assets(),
      IMAGES: bindings.images(),
    },
  }),
});
