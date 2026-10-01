import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
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
