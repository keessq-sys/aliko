<script lang="ts">
  import "../app.css";
  import { setupConvex } from "convex-svelte";
  import { env as publicEnv } from "$env/dynamic/public";
  import { browser } from "$app/environment";
  // Falls back to a placeholder when no deployment is configured: setupConvex
  // requires a non-empty URL, and ConvexClient is constructed disabled during
  // SSR, so nothing connects unless a real PUBLIC_CONVEX_URL is provided in .env.
  const PUBLIC_CONVEX_URL =
    (publicEnv as Record<string, string | undefined>).PUBLIC_CONVEX_URL ?? "";
  const convexUrl = PUBLIC_CONVEX_URL || "https://preview-placeholder.convex.cloud";
  import Header from "$lib/components/layout/Header.svelte";
  import Footer from "$lib/components/layout/Footer.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";
  import MobileBottomNav from "$lib/components/layout/MobileBottomNav.svelte";
  import { page } from "$app/stores";

  export let data: {
    session?: { user?: { name?: string | null; email?: string | null; role?: string; id?: string | null } } | null;
    /** Global Organization + WebSite JSON-LD, built once in +layout.server.ts.
     *  Safe to render unconditionally: unlike title/description/OG, a second
     *  <script type="application/ld+json"> block per page is valid schema.org
     *  usage, so this never collides with a page's own per-page graph. */
    globalSchemaJson?: string;
  };

  // Initialize Convex real-time client (falls back gracefully when unset)
  setupConvex(convexUrl, {
    disabled: !browser || !PUBLIC_CONVEX_URL || convexUrl.includes("preview-placeholder"),
  });

  // Hide header/footer on dashboard and auth routes
  $: isDashboardRoute = $page.url.pathname.startsWith("/dashboard");
  $: isAdminRoute = $page.url.pathname.startsWith("/admin");
  $: isAuthRoute = $page.url.pathname.startsWith("/auth") || $page.url.pathname.startsWith("/register");
  $: hideHeader = isDashboardRoute || isAdminRoute;
  $: hideFooter = isDashboardRoute || isAdminRoute;
  // Dashboard/admin routes already have their own drawer-based mobile nav;
  // the bottom tab bar is only for the public marketing/browsing site.
  $: showMobileBottomNav = !isDashboardRoute && !isAdminRoute && !isAuthRoute;
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
  <meta name="theme-color" content="#050A0E" />
  <!-- title/description/OG/Twitter/canonical are intentionally NOT set here.
       Rendering them at the layout level would duplicate whatever a page's
       own <SEO seo={...} /> (or inline <svelte:head>) sets — two
       <meta name="description"> tags on one page actively hurts SEO. Each
       page is the single owner of its own meta tags; see src/lib/seo.ts. -->
  {#if data.globalSchemaJson}
    {@html `<script type="application/ld+json">${data.globalSchemaJson}<\/script>`}
  {/if}
</svelte:head>

{#if !hideHeader}
  <Header session={data.session} />
{/if}

<main class="{showMobileBottomNav ? 'pb-16 md:pb-0' : ''} min-h-screen bg-[#050A0E]">
  <slot />
</main>

{#if !hideFooter}
  <Footer />
{/if}

{#if showMobileBottomNav}
  <MobileBottomNav />
{/if}

<!-- Global Toast Notifications -->
<Toast />
