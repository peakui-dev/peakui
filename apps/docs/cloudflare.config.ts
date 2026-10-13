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
    // The proxy negotiates markdown vs HTML on page URLs; a matching static asset must not
    // be served without the Worker running first.
    assets: {notFoundHandling: "none", runWorkerFirst: true},
    env: {
      ASSETS: bindings.assets(),
      IMAGES: bindings.images(),
    },
  }),
});
