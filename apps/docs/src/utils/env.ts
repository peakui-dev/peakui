const DEV_FALLBACK = "http://localhost:3000";

/**
 * Resolves the public origin of the docs site from `NEXT_PUBLIC_SITE_URL`.
 *
 * Absolute URLs in the llms files, the JSON index and the markdown routes come from it, so a
 * missing or malformed value in production would ship `localhost` links to agents. Production
 * therefore throws when the module loads: during `next build` and equally on `next start`, which
 * covers the routes that render at request time. Development and tests fall back to the local dev
 * server.
 */
export function resolveBaseURL(configured: string | undefined, isProduction: boolean): URL {
  if (configured) {
    try {
      return new URL(configured);
    } catch {
      // handled below: malformed is as unusable as unset
    }
  }

  if (isProduction) {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL must be set to the absolute public URL of the docs site (for example https://docs.example.com) in production. Received: ${
        configured ? JSON.stringify(configured) : "nothing"
      }. See apps/docs/.env.example.`,
    );
  }

  return new URL(DEV_FALLBACK);
}

// Dot access on purpose: Next inlines `process.env.NEXT_PUBLIC_*` at build time, so a server that
// started from a build made with the variable set keeps the same value.
export const __BASE_URL__ = resolveBaseURL(
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.NODE_ENV === "production",
);
