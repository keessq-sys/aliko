import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ cookies }) => {
  // Convex auth stores a session token in a cookie named "__convexAuthJWT"
  // We read the token here to pass basic session info to the layout for
  // server-rendered pages (auth state is fully hydrated client-side via
  // Convex's real-time subscription, so this is just for SSR pre-rendering).
  const token = cookies.get("__convexAuthJWT");

  if (!token) {
    return { session: null };
  }

  try {
    // Decode JWT payload (no verification needed here — Convex verifies it)
    const [, payloadB64] = token.split(".");
    const payload = JSON.parse(atob(payloadB64));
    return {
      session: {
        user: {
          name: payload.name ?? null,
          email: payload.email ?? null,
          role: payload.role ?? "CLIENT",
          id: payload.sub ?? null,
        },
      },
    };
  } catch {
    return { session: null };
  }
};
