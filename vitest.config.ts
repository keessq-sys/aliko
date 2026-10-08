import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
export default defineConfig({
  resolve: {
    alias: { $lib: fileURLToPath(new URL("./src/lib", import.meta.url)) },
  },
  test: {
    maxWorkers: 2,
    include: ["tests/backend/**/*.test.ts"],
    environment: "edge-runtime",
    server: {
      deps: {
        inline: [
          "convex-test",
          "@convex-dev/rate-limiter",
          "@convex-dev/batch-worker",
        ],
      },
    },
  },
});
