import { sessionToken } from "$lib/server/auth-session";
import type { LayoutServerLoad } from "./$types";
import { defaultSEO } from "$lib/seo";
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
} from "$lib/schema/builders";
import { buildPageGraph } from "$lib/schema/graph";

// Organization + WebSite are site-wide entities (not page-specific), so they
// are built once here and merged into every page's @graph in +layout.svelte,
// rather than being rebuilt by every route.
const globalSchema = [buildOrganizationSchema(), buildWebSiteSchema()];

export const load: LayoutServerLoad = async ({ cookies, locals, url }) => {
  // Convex auth stores a session token in a cookie named "__convexAuthJWT"
  // We read the token here to pass basic session info to the layout for
  // server-rendered pages (auth state is fully hydrated client-side via
  // Convex's real-time subscription, so this is just for SSR pre-rendering).
  const token = locals.user
    ? cookies.get("__convexAuthJWT")
    : await sessionToken(cookies, url).catch(() => null);

  const seoBase = {
    seo: defaultSEO,
    globalSchemaJson: buildPageGraph(globalSchema),
  };

  if (!token) {
    return { session: null, ...seoBase };
  }

  if (locals.user) {
    return {
      session: {
        user: {
          name: locals.user.name ?? null,
          email: locals.user.email ?? null,
          role: locals.user.role ?? "CLIENT",
          id: locals.user._id ?? null,
        },
      },
      ...seoBase,
    };
  }

  try {
    const { ConvexHttpClient } = await import("convex/browser");
    const { makeFunctionReference } = await import("convex/server");
    const { env } = await import("$env/dynamic/public");
    if (!env.PUBLIC_CONVEX_URL) return { session: null, ...seoBase };
    const client = new ConvexHttpClient(env.PUBLIC_CONVEX_URL);
    client.setAuth(token);
    const profile: any = await client.query(
      makeFunctionReference<"query">("users:getMyProfile"),
      {},
    );
    return {
      session: profile
        ? {
            user: {
              name: profile.name,
              email: profile.email,
              role: profile.role,
              id: profile._id,
            },
          }
        : null,
      ...seoBase,
    };
  } catch {
    return { session: null, ...seoBase };
  }
};
