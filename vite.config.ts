import { sveltekit } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  ssr: {
    // Convex browser client must not be SSR'd
    noExternal: ["convex", "convex-svelte"],
  },
  optimizeDeps: {
    include: ["three", "lucide-svelte"],
  },
});
