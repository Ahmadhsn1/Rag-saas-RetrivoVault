import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.{test,spec}.js"],
    setupFiles: ["./src/test/setup.js"],
    hookTimeout: 120000,
    testTimeout: 20000,
    fileParallelism: false,
  },
});
