import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      // Cloudflare Pages deployment target
      routes: {
        // Exclude static assets from function processing
        exclude: ["<all>"],
        include: ["/*"],
      },
      platformProxy: {
        // Enable local Cloudflare env simulation via wrangler
        configPath: "wrangler.toml",
        environment: undefined,
        experimentalJsonConfig: false,
        persist: false,
      },
    }),
    alias: {
      // Clean path aliases
      $components: "src/lib/components",
      $stores: "src/lib/stores",
      $server: "src/lib/server",
      $utils: "src/lib/utils",
      $types: "src/lib/types",
    },
    csrf: {
      checkOrigin: true,
    },
  },
};

export default config;
