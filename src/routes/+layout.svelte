<script lang="ts">
  import "../app.css";
  import { provideI18n } from "$lib/i18n";
  import { afterNavigate } from "$app/navigation";
  import { api } from "$lib/convex/_generated/api";
  import { runMutation } from "$lib/convex/queries";
  import { fetchSessionToken } from "$lib/convex/session";
  import { getConvexClient, setupConvex } from "convex-svelte";
  import { env as publicEnv } from "$env/dynamic/public";
  import { browser } from "$app/environment";
  // Falls back to a placeholder when no deployment is configured: setupConvex
  // requires a non-empty URL, and ConvexClient is constructed disabled during
  // SSR, so nothing connects unless a real PUBLIC_CONVEX_URL is provided in .env.
  const PUBLIC_CONVEX_URL =
    (publicEnv as Record<string, string | undefined>).PUBLIC_CONVEX_URL ?? "";
  const convexUrl =
    PUBLIC_CONVEX_URL || "https://preview-placeholder.convex.cloud";
  import Header from "$lib/components/layout/Header.svelte";
  import Footer from "$lib/components/layout/Footer.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";
  import MobileBottomNav from "$lib/components/layout/MobileBottomNav.svelte";
  import { page, navigating } from "$app/stores";
  import DashboardSidebar from "$lib/components/layout/DashboardSidebar.svelte";
  import WorkspaceNavigation from "$lib/components/layout/WorkspaceNavigation.svelte";
  import { invalidateAll } from "$app/navigation";
  import { onMount } from "svelte";
  import { addToast } from "$lib/stores/ui";
  onMount(() => {
    const showError = () =>
      addToast({
        type: "error",
        message:
          "Current data could not be loaded. Refresh the page to try again.",
        duration: 8000,
      });
    const sessionChanged = (event: StorageEvent) => {
      if (event.key === "adk-session-changed") {
        getConvexClient().setAuth(fetchSessionToken);
        void invalidateAll();
      }
    };
    window.addEventListener("storage", sessionChanged);
    window.addEventListener("adk-query-error", showError);
    return () => {
      window.removeEventListener("adk-query-error", showError);
      window.removeEventListener("storage", sessionChanged);
    };
  });

  export let data: {
    locale?: "en" | "ar";
    session?: {
      user?: {
        name?: string | null;
        email?: string | null;
        role?: string;
        id?: string | null;
      };
    } | null;
    /** Global Organization + WebSite JSON-LD, built once in +layout.server.ts.
     *  Safe to render unconditionally: unlike title/description/OG, a second
     *  <script type="application/ld+json"> block per page is valid schema.org
     *  usage, so this never collides with a page's own per-page graph. */
    globalSchemaJson?: string;
  };

  const { locale, t: adkT } = provideI18n(data.locale ?? "en");
  $: locale.set(data.locale ?? "en");
  afterNavigate(() => {
    if (data.session?.user?.id)
      void runMutation(api.activity.record, {
        kind: "PAGE_VIEW",
        path: $page.url.pathname,
      }).catch(() => {});
  });
  // Initialize Convex real-time client (falls back gracefully when unset)
  setupConvex(convexUrl, {
    disabled:
      !browser ||
      !PUBLIC_CONVEX_URL ||
      convexUrl.includes("preview-placeholder"),
  });

  if (browser && PUBLIC_CONVEX_URL)
    getConvexClient().setAuth(fetchSessionToken);
  // Hide header/footer on dashboard and auth routes
  $: isDashboardRoute = $page.url.pathname.startsWith("/dashboard");
  $: isAdminRoute = $page.url.pathname.startsWith("/admin");
  $: isAuthRoute =
    $page.url.pathname.startsWith("/auth") ||
    $page.url.pathname.startsWith("/register");
  $: hideHeader = isDashboardRoute || isAdminRoute;
  $: hideFooter = isDashboardRoute || isAdminRoute;
  $: sharedAccountPage =
    isDashboardRoute &&
    !["/dashboard/client", "/dashboard/agent", "/dashboard/manager"].includes(
      $page.url.pathname,
    );
  $: roleDashboard =
    data.session?.user?.role === "ADMIN"
      ? "/admin"
      : data.session?.user?.role === "AGENT"
        ? "/dashboard/agent"
        : data.session?.user?.role === "ESTATE_MANAGER"
          ? "/dashboard/manager"
          : "/dashboard/client";
  $: accountLinks = [
    { id: "dashboard", label: "Dashboard", href: roleDashboard },
    { id: "account", label: "My profile", href: "/dashboard/account" },
    {
      id: "subscriptions",
      label: "Manage subscription",
      href: "/dashboard/subscriptions",
    },
    { id: "payments", label: "My payments", href: "/dashboard/payments" },
    {
      id: "messages",
      label: "Company conversations",
      href: "/dashboard/messages",
    },
    { id: "properties", label: "Properties", href: "/properties" },
    { id: "services", label: "Services", href: "/services" },
  ];
  // Dashboard/admin routes already have their own drawer-based mobile nav;
  // the bottom tab bar is only for the public marketing/browsing site.
  $: showMobileBottomNav = !isDashboardRoute && !isAdminRoute && !isAuthRoute;
</script>

<svelte:head>
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

{#if $navigating}
  <div
    role="progressbar"
    aria-label={$adkT("Loading")}
    class="route-progress"
  ></div>
{/if}

{#if !hideHeader}
  <Header session={data.session} />
{:else}
  <WorkspaceNavigation role={data.session?.user?.role ?? "CLIENT"} />
{/if}

<main
  class="app-shell {hideHeader ? 'private-workspace' : ''} {showMobileBottomNav
    ? 'pb-16 md:pb-0'
    : ''} min-h-screen bg-[#050A0E]"
>
  {#if sharedAccountPage}
    <div class="flex flex-col md:flex-row" dir="ltr">
      <DashboardSidebar
        items={accountLinks}
        active={$page.url.pathname.split("/").at(-1) ?? ""}
      />
      <div class="min-w-0 flex-1" dir={$locale === "ar" ? "rtl" : "ltr"}>
        <slot />
      </div>
    </div>
  {:else}<slot />{/if}
</main>

{#if !hideFooter}
  <Footer />
{/if}

{#if showMobileBottomNav}
  <MobileBottomNav />
{/if}

<!-- Global Toast Notifications -->
<Toast />
