// src/hooks.server.ts
// Runs on every request through the Cloudflare adapter's worker. Two AEO/GEO
// jobs live here: (1) an authoritative X-Robots-Tag on private routes — this
// is the header search engines and AI crawlers trust over robots.txt alone,
// since robots.txt only asks a *compliant* crawler not to fetch a URL, while
// X-Robots-Tag tells any crawler that DOES fetch it not to index what it got;
// (2) baseline security/cache headers. Protected routes additionally verify
// the Convex session and enforce role and account-status boundaries.
import type { Handle } from "@sveltejs/kit";
import { sessionToken } from "$lib/server/auth-session";
import { redirect } from "@sveltejs/kit";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { env } from "$env/dynamic/public";
import { env as privateEnv } from "$env/dynamic/private";
import { sequence } from "@sveltejs/kit/hooks";
import {
  handleErrorWithSentry,
  initCloudflareSentryHandle,
  sentryHandle,
} from "@sentry/sveltekit";

/** Route prefixes that must never be indexed or cited, even if a crawler
 *  ignores robots.txt or a private URL gets linked from somewhere external. */
const PRIVATE_PREFIXES = [
  "/admin",
  "/dashboard",
  "/checkout",
  "/auth",
  "/login",
  "/register",
  "/legal/track",
];

/** Known AI-crawler / answer-engine user-agent substrings, used only to tag
 *  the request for server-side observability (no third-party call, no PII). */
const AI_BOT_PATTERNS: Array<[string, RegExp]> = [
  ["GPTBot", /GPTBot/i],
  ["OAI-SearchBot", /OAI-SearchBot/i],
  ["ChatGPT-User", /ChatGPT-User/i],
  ["ClaudeBot", /ClaudeBot/i],
  ["Claude-User", /Claude-User/i],
  ["anthropic-ai", /anthropic-ai/i],
  ["PerplexityBot", /PerplexityBot/i],
  ["Perplexity-User", /Perplexity-User/i],
  ["Google-Extended", /Google-Extended/i],
  ["cohere-ai", /cohere-ai/i],
  ["YouBot", /YouBot/i],
  ["DuckAssistBot", /DuckAssistBot/i],
  ["Applebot-Extended", /Applebot-Extended/i],
  ["Amazonbot", /Amazonbot/i],
  ["Bytespider", /Bytespider/i],
];

function detectAiBot(userAgent: string | null): string | null {
  if (!userAgent) return null;
  for (const [name, pattern] of AI_BOT_PATTERNS) {
    if (pattern.test(userAgent)) return name;
  }
  return null;
}

function isPrivateRoute(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

const applicationHandle: Handle = async ({ event, resolve }) => {
  const aiBot = detectAiBot(event.request.headers.get("user-agent"));
  if (aiBot) {
    // Cloudflare Pages captures stdout in the Functions log; this is the
    // cheapest "AI referral" signal available without adding an analytics
    // dependency. Swap for a real analytics call if one is ever introduced.
    console.log(
      `[ai-crawler] ${aiBot} ${event.request.method} ${event.url.pathname}`,
    );
    event.locals.aiBot = aiBot;
  }

  const pathname = event.url.pathname;
  const scheduledMaintenance =
    pathname === "/api/media/maintenance" &&
    Boolean(event.request.headers.get("authorization"));
  // The maintenance handler validates its service secret independently.
  if (
    (pathname.startsWith("/admin") && pathname !== "/admin-login") ||
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/checkout/") ||
    (pathname.startsWith("/api/media/") &&
      event.request.method !== "GET" &&
      !scheduledMaintenance)
  ) {
    const token = await sessionToken(
      event.cookies,
      event.url,
      false,
      event.locals,
    ).catch(() => null);
    if (!token || !env.PUBLIC_CONVEX_URL) {
      if (pathname.startsWith("/api/"))
        return new Response("Forbidden", { status: 403 });
      throw redirect(
        303,
        pathname.startsWith("/admin")
          ? "/auth/admin"
          : `/auth?tab=signin&redirect=${encodeURIComponent(pathname)}`,
      );
    }
    try {
      const client = new ConvexHttpClient(env.PUBLIC_CONVEX_URL);
      client.setAuth(token);
      const profile =
        event.locals.user ??
        (await client.query(
          makeFunctionReference<"query">("users:getMyProfile"),
          {},
        ));
      if (!profile || profile.accountStatus === "SUSPENDED")
        throw new Error("No authenticated profile");
      event.locals.user = profile as App.Locals["user"];
      const requiredRole = pathname.startsWith("/admin")
        ? "ADMIN"
        : pathname.startsWith("/dashboard/agent")
          ? "AGENT"
          : pathname.startsWith("/dashboard/manager")
            ? "ESTATE_MANAGER"
            : null;
      if (
        pathname.startsWith("/dashboard/operations") &&
        !["ADMIN", "ESTATE_MANAGER"].includes(profile.role)
      )
        throw redirect(303, "/unauthorized");
      if (requiredRole && profile.role !== requiredRole && profile.role !== "ADMIN")
        throw redirect(303, "/unauthorized");
      if (profile.role === "ESTATE_MANAGER" && (pathname.startsWith("/dashboard/manager") || pathname.startsWith("/dashboard/operations"))) {
        const entitlement = await client.query(makeFunctionReference<"query">("subscriptions:mine"), {});
        if (!entitlement.access.allowed) throw redirect(303, "/dashboard/subscriptions");
      }
      if (
        pathname.startsWith("/api/media/") &&
        !["ADMIN", "AGENT", "ESTATE_MANAGER"].includes(profile.role)
      ) {
        return new Response("Forbidden", { status: 403 });
      }
    } catch (error) {
      if ((error as { status?: number }).status === 303) throw error;

      if (pathname.startsWith("/api/"))
        return new Response("Forbidden", { status: 403 });
      throw redirect(
        303,
        pathname.startsWith("/admin")
          ? "/auth/admin"
          : `/auth?tab=signin&redirect=${encodeURIComponent(pathname)}`,
      );
    }
  }

  const language = event.cookies.get("adk-language") === "ar" ? "ar" : "en";
  const response = await resolve(event, {
    transformPageChunk: ({ html }) =>
      html.replace(
        '<html lang="en"',
        `<html lang="${language}" dir="${language === "ar" ? "rtl" : "ltr"}"`,
      ),
  });
  response.headers.append("Vary", "Cookie");
  response.headers.set("Content-Language", language);

  if (isPrivateRoute(pathname)) {
    // Authoritative "do not index" — wins over any inherited/default indexing
    // even for a crawler that fetched the page despite robots.txt.
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    response.headers.set("Cache-Control", "private, no-store");
  } else {
    response.headers.set(
      "X-Robots-Tag",
      "index, follow, max-image-preview:large",
    );
  }

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
};

const sentryInit: Handle | null = privateEnv.SENTRY_DSN
  ? initCloudflareSentryHandle({
      dsn: privateEnv.SENTRY_DSN,
      enabled: Boolean(privateEnv.SENTRY_DSN),
      environment: privateEnv.SENTRY_ENVIRONMENT ?? "production",
      release: privateEnv.SENTRY_RELEASE,
      tracesSampleRate: 0.1,
      beforeSend(event) {
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers;
          delete event.request.query_string;
          delete event.request.data;
        }
        if (event.user) event.user = { id: event.user.id };
        return event;
      },
    })
  : null;

export const handle = privateEnv.SENTRY_DSN
  ? sequence(sentryInit!, sentryHandle(), applicationHandle)
  : applicationHandle;
export const handleError = handleErrorWithSentry(({ message }) => ({
  message,
}));
