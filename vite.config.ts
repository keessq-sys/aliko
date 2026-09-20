import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

// Force the pure-browser Convex client even in SSR bundles: the "node" export
// condition variant imports node builtins ("module", "path"), which the
// Cloudflare adapter's esbuild step rejects. The ConvexClient is constructed
// disabled during SSR anyway (setupConvex in +layout.svelte).
const convexBrowserEsm = fileURLToPath(
  new URL("./node_modules/convex/dist/esm/browser/index.js", import.meta.url)
);

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      "convex/browser": convexBrowserEsm,
    },
  },
  ssr: {
    // Convex browser client must not be SSR'd
    noExternal: ["convex", "convex-svelte"],
  },
  optimizeDeps: {
    include: ["three", "lucide-svelte"],
  },
});
