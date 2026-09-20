// Convex client bootstrap constants with fail-safe fallbacks so the app
// renders everywhere even before PUBLIC_CONVEX_URL is configured.
export const PUBLIC_CONVEX_URL: string =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CONVEX_URL) ||
  (typeof process !== 'undefined' && (process as any).env?.PUBLIC_CONVEX_URL) ||
  '';
