import {describe, expect, it} from "vitest";

import {version} from "./index.ts";

describe("@peakui/styles", () => {
  it("экспортирует версию пакета", () => {
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
