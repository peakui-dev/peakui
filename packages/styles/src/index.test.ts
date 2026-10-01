import {describe, expect, it} from "vitest";

import {version} from "./index";

describe("@peakui/styles", () => {
  it("экспортирует версию пакета", () => {
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
