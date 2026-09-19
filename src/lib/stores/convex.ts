import { ConvexClient } from "convex/browser";
import { setupConvex } from "convex-svelte";
import { PUBLIC_CONVEX_URL } from "$env/static/public";
import { browser } from "$app/environment";

// Singleton Convex client — initialized once in the browser
let _client: ConvexClient | null = null;

export function getConvexClient(): ConvexClient {
  if (!browser) throw new Error("Convex client can only be used in the browser");
  if (!_client) {
    _client = new ConvexClient(PUBLIC_CONVEX_URL);
  }
  return _client;
}

// Initialize Convex in the SvelteKit root layout
export function initConvex() {
  return setupConvex(PUBLIC_CONVEX_URL);
}

export { setupConvex };
