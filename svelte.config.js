import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/**
 * adapter-cloudflare's emulate() spawns workerd/miniflare at build time, which
 * crashes on this Windows machine (write EOF / UV_EPIPE). The application
 * stores no state in Cloudflare bindings — all data flows through Convex over
 * HTTPS — so we keep the real adapter (bundling + Pages deploy target) and
 * stub only the build-time platform emulation.
 */
const cloudflareAdapter = {
  ...adapter({
    routes: {
      exclude: ["<all>"],
      include: ["/*"],
    },
  }),
  async emulate() {
    return { platform: () => ({}) };
  },
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: cloudflareAdapter,
    alias: {
      // Clean path aliases
      $components: "src/lib/components",
      $stores: "src/lib/stores",
      $server: "src/lib/server",
      $utils: "src/lib/utils",
      $types: "src/lib/types",
    },
    // No explicit csrf block: `checkOrigin` defaulted to `true` (its own
    // default value), so this was a no-op restating the default — and
    // `checkOrigin` is deprecated in favor of `trustedOrigins`, which is a
    // different mechanism (an allowlist of extra trusted origins, not a
    // boolean toggle) with its own default of `[]`. Omitting the block
    // keeps the exact same CSRF-protected behavior with no deprecation warning.
  },
};

export default config;
