import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/solutions/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 600_000,
    hookTimeout: 900_000,
  },
});
