const appEnv = process.env["NEXT_PUBLIC_APP_ENV"] ?? "development";

export const __DEV__ = appEnv === "development";
export const __PREVIEW__ = appEnv === "preview";
export const __PROD__ = appEnv === "production";

/**
 * The public origin of the docs site. The production host is not decided yet, so it is read from
 * `NEXT_PUBLIC_SITE_URL` and falls back to the local dev server.
 */
function getBaseURL(): URL {
  const configured = process.env["NEXT_PUBLIC_SITE_URL"];

  if (configured) {
    try {
      return new URL(configured);
    } catch {
      // fall through to the default below
    }
  }

  return new URL("http://localhost:3000");
}

export const __BASE_URL__ = getBaseURL();
