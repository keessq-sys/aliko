import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
export default defineConfig({
  resolve: {
    alias: { $lib: fileURLToPath(new URL("./src/lib", import.meta.url)) },
  },
  test: {
    maxWorkers: 2,
    // Authentication fixtures generate RSA keys and start esbuild. Bound their
    // setup separately from assertions on memory-constrained operator machines.
    testTimeout: 30000,
    hookTimeout: 60000,
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
