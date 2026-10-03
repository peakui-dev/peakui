import {afterEach, describe, expect, it, vi} from "vitest";

import {resolveBaseURL} from "@/utils/env";

describe("resolveBaseURL", () => {
  it("returns the configured origin", () => {
    expect(resolveBaseURL("https://docs.example.test", true).origin).toBe(
      "https://docs.example.test",
    );
    expect(resolveBaseURL("https://docs.example.test", false).origin).toBe(
      "https://docs.example.test",
    );
  });

  it("falls back to the local dev server when unset outside production", () => {
    expect(resolveBaseURL(undefined, false).origin).toBe("http://localhost:3000");
    expect(resolveBaseURL("", false).origin).toBe("http://localhost:3000");
  });

  it("throws when unset in production", () => {
    expect(() => resolveBaseURL(undefined, true)).toThrow(/NEXT_PUBLIC_SITE_URL/);
    expect(() => resolveBaseURL("", true)).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("treats a malformed value as unusable in production and as unset in development", () => {
    expect(() => resolveBaseURL("not a url", true)).toThrow(/NEXT_PUBLIC_SITE_URL/);
    expect(resolveBaseURL("not a url", false).origin).toBe("http://localhost:3000");
  });
});

describe("module load", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("throws at import time in production without the variable, even outside `next build`", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.resetModules();

    await expect(import("@/utils/env")).rejects.toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("loads in production when the variable is valid", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://docs.example.test");
    vi.resetModules();

    const {__BASE_URL__} = await import("@/utils/env");

    expect(__BASE_URL__.origin).toBe("https://docs.example.test");
  });
});
