import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    fileParallelism: false,
    setupFiles: ["./tests/setup/env.js", "./tests/setup/db.js"],
    testTimeout: 20000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "./coverage",
      exclude: [
        "tests/**",
        "scripts/**",
        "src/server.js",
        "**/*.config.js"
      ],
      thresholds: {
        lines: 75,
        functions: 78,
        statements: 75,
        branches: 60
      }
    }
  }
});
