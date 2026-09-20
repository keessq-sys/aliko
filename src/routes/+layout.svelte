<script lang="ts">
  import "../app.css";
  import { setupConvex } from "convex-svelte";
  import { env as publicEnv } from "$env/dynamic/public";
  // Falls back to a placeholder when no deployment is configured: setupConvex
  // requires a non-empty URL, and ConvexClient is constructed disabled during
  // SSR, so nothing connects unless a real PUBLIC_CONVEX_URL is provided in .env.
  const PUBLIC_CONVEX_URL =
    (publicEnv as Record<string, string | undefined>).PUBLIC_CONVEX_URL ?? "";
  const convexUrl = PUBLIC_CONVEX_URL || "https://preview-placeholder.convex.cloud";
  import Header from "$lib/components/layout/Header.svelte";
  import Footer from "$lib/components/layout/Footer.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";
  import { page } from "$app/stores";

  export let data: { session?: { user?: { name?: string | null; email?: string | null; role?: string; id?: string | null } } | null };

  // Initialize Convex real-time client (falls back gracefully when unset)
  setupConvex(convexUrl);

  // Hide header/footer on dashboard and auth routes
  $: isDashboardRoute = $page.url.pathname.startsWith("/dashboard");
  $: isAdminRoute = $page.url.pathname.startsWith("/admin");
  $: isAuthRoute = $page.url.pathname.startsWith("/auth") || $page.url.pathname.startsWith("/register");
  $: hideHeader = isDashboardRoute || isAdminRoute;
  $: hideFooter = isDashboardRoute || isAdminRoute;
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
  <meta name="description" content="Aliko Diamond Key — Nigeria's Premier Real Estate & Property Management Platform" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Aliko Diamond Key — Premium Real Estate" />
  <meta property="og:description" content="1,200+ verified properties across Nigeria. Zero legal risk. Automated title documentation." />
  <meta name="theme-color" content="#050A0E" />
</svelte:head>

{#if !hideHeader}
  <Header session={data.session} />
{/if}

<main class="{hideHeader ? '' : 'pt-20'} min-h-screen bg-[#050A0E]">
  <slot />
</main>

{#if !hideFooter}
  <Footer />
{/if}

<!-- Global Toast Notifications -->
<Toast />
