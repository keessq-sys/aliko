// src/hooks.server.ts
// Runs on every request through the Cloudflare adapter's worker. Two AEO/GEO
// jobs live here: (1) an authoritative X-Robots-Tag on private routes — this
// is the header search engines and AI crawlers trust over robots.txt alone,
// since robots.txt only asks a *compliant* crawler not to fetch a URL, while
// X-Robots-Tag tells any crawler that DOES fetch it not to index what it got;
// (2) baseline security/cache headers. Nothing here touches auth, routing or
// Convex — it only decorates the outgoing Response.
import type { Handle } from '@sveltejs/kit';

/** Route prefixes that must never be indexed or cited, even if a crawler
 *  ignores robots.txt or a private URL gets linked from somewhere external. */
const PRIVATE_PREFIXES = ['/admin', '/dashboard', '/auth', '/login', '/register', '/legal/track'];

/** Known AI-crawler / answer-engine user-agent substrings, used only to tag
 *  the request for server-side observability (no third-party call, no PII). */
const AI_BOT_PATTERNS: Array<[string, RegExp]> = [
  ['GPTBot', /GPTBot/i],
  ['OAI-SearchBot', /OAI-SearchBot/i],
  ['ChatGPT-User', /ChatGPT-User/i],
  ['ClaudeBot', /ClaudeBot/i],
  ['Claude-User', /Claude-User/i],
  ['anthropic-ai', /anthropic-ai/i],
  ['PerplexityBot', /PerplexityBot/i],
  ['Perplexity-User', /Perplexity-User/i],
  ['Google-Extended', /Google-Extended/i],
  ['cohere-ai', /cohere-ai/i],
  ['YouBot', /YouBot/i],
  ['DuckAssistBot', /DuckAssistBot/i],
  ['Applebot-Extended', /Applebot-Extended/i],
  ['Amazonbot', /Amazonbot/i],
  ['Bytespider', /Bytespider/i]
];

function detectAiBot(userAgent: string | null): string | null {
  if (!userAgent) return null;
  for (const [name, pattern] of AI_BOT_PATTERNS) {
    if (pattern.test(userAgent)) return name;
  }
  return null;
}

function isPrivateRoute(pathname: string): boolean {
  return PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export const handle: Handle = async ({ event, resolve }) => {
  const aiBot = detectAiBot(event.request.headers.get('user-agent'));
  if (aiBot) {
    // Cloudflare Pages captures stdout in the Functions log; this is the
    // cheapest "AI referral" signal available without adding an analytics
    // dependency. Swap for a real analytics call if one is ever introduced.
    console.log(`[ai-crawler] ${aiBot} ${event.request.method} ${event.url.pathname}`);
    event.locals.aiBot = aiBot;
  }

  const response = await resolve(event);

  const pathname = event.url.pathname;

  if (isPrivateRoute(pathname)) {
    // Authoritative "do not index" — wins over any inherited/default indexing
    // even for a crawler that fetched the page despite robots.txt.
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store');
  } else {
    response.headers.set('X-Robots-Tag', 'index, follow, max-image-preview:large');
  }

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
};
