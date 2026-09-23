import type { LayoutServerLoad } from "./$types";
import { defaultSEO } from "$lib/seo";
import { buildOrganizationSchema, buildWebSiteSchema } from "$lib/schema/builders";
import { buildPageGraph } from "$lib/schema/graph";

// Organization + WebSite are site-wide entities (not page-specific), so they
// are built once here and merged into every page's @graph in +layout.svelte,
// rather than being rebuilt by every route.
const globalSchema = [buildOrganizationSchema(), buildWebSiteSchema()];

export const load: LayoutServerLoad = async ({ cookies, locals }) => {
  // Convex auth stores a session token in a cookie named "__convexAuthJWT"
  // We read the token here to pass basic session info to the layout for
  // server-rendered pages (auth state is fully hydrated client-side via
  // Convex's real-time subscription, so this is just for SSR pre-rendering).
  const token = cookies.get("__convexAuthJWT");

  const seoBase = { seo: defaultSEO, globalSchemaJson: buildPageGraph(globalSchema) };

  if (!token) {
    return { session: null, ...seoBase };
  }

  if (locals.user) {
    return {
      session: { user: { name: locals.user.name ?? null, email: locals.user.email ?? null, role: locals.user.role ?? 'CLIENT', id: locals.user._id ?? null } },
      ...seoBase,
    };
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
      ...seoBase,
    };
  } catch {
    return { session: null, ...seoBase };
  }
};
