const DEV_FALLBACK = "http://localhost:3000";

/**
 * Resolves the public origin of the docs site from `NEXT_PUBLIC_SITE_URL`.
 *
 * The production build prerenders every absolute URL in the llms files and the JSON index, so a
 * missing or malformed value there would ship `localhost` links to agents. It fails the build
 * instead. Development and tests fall back to the local dev server.
 */
export function resolveBaseURL(configured: string | undefined, isProductionBuild: boolean): URL {
  if (configured) {
    try {
      return new URL(configured);
    } catch {
      // handled below: malformed is as unusable as unset
    }
  }

  if (isProductionBuild) {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL must be set to the absolute public URL of the docs site (for example https://docs.example.com) for a production build. Received: ${
        configured ? JSON.stringify(configured) : "nothing"
      }. See apps/docs/.env.example.`,
    );
  }

  return new URL(DEV_FALLBACK);
}

export const __BASE_URL__ = resolveBaseURL(
  process.env["NEXT_PUBLIC_SITE_URL"],
  process.env["NEXT_PHASE"] === "phase-production-build",
);
