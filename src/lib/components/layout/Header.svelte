<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();

  import LanguageSwitcher from "$lib/components/ui/LanguageSwitcher.svelte";
  import {
    ArrowLeft,
    ArrowRight,
    Menu,
    X,
    Bell,
    User,
    Users,
    Home,
    LogOut,
    Settings,
    LayoutDashboard,
    Map as MapIcon,
    ChevronDown,
    ChevronRight,
    Lamp,
    Building,
    HardHat,
    Cpu,
    Grid3x3,
    Sofa,
    Sparkles,
    FileSignature,
    Hammer,
    DraftingCompass,
    LayoutGrid,
    Building2,
    Landmark,
  } from "lucide-svelte";
  import { slide } from "svelte/transition";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { api } from "$lib/convex/_generated/api";
  import { runAction } from "$lib/convex/queries";
  import { addToast } from "$lib/stores/ui";
  import ThemeToggle from "$lib/components/ui/ThemeToggle.svelte";

  export let session: {
    user?: {
      name?: string | null;
      email?: string | null;
      role?: string;
      id?: string | null;
    };
  } | null = null;

  let headerElement: HTMLElement;
  let isMobileMenuOpen = false;
  let isProfileMenuOpen = false;

  $: isLoggedIn = !!session?.user;
  $: userRole = (session?.user?.role ?? "client").toLowerCase();
  $: displayName = session?.user?.name || session?.user?.email || "Account";
  let unreadNotifications = 0;

  async function signOut() {
    try {
      await runAction(api.auth.signOut, {});
    } catch {
      addToast({
        type: "error",
        message: "Sign out could not be confirmed. Please retry.",
      });
      return;
    }
    isProfileMenuOpen = false;
    isMobileMenuOpen = false;
    await goto("/", { invalidateAll: true });
  }

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Properties", href: "/properties" },
    { name: "Land Plots", href: "/plots" },
    { name: "Agents", href: "/agents" },
    { name: "Map View", href: "/map" },
  ];

  const serviceLinks = [
    { name: "Interior Design", href: "/services/interior-design", icon: Lamp },
    {
      name: "Decoration & Styling",
      href: "/services/decoration-styling",
      icon: Sparkles,
    },
    { name: "Furnishing", href: "/services/furnishing", icon: Sofa },
    {
      name: "Renovation & Refurbishing",
      href: "/services/renovation-refurbishment",
      icon: Hammer,
    },
    {
      name: "Turkish & Foreign Tiles",
      href: "/services/turkish-tiles-supply",
      icon: Grid3x3,
    },
    {
      name: "Building Materials",
      href: "/services/building-materials-supply",
      icon: HardHat,
    },
    {
      name: "Smart Home Installation",
      href: "/services/smart-home-installation",
      icon: Cpu,
    },
    {
      name: "Construction",
      href: "/services/construction-services",
      icon: Building,
    },
    {
      name: "Architectural Design",
      href: "/services/architectural-design",
      icon: DraftingCompass,
    },
    {
      name: "Space Planning & Management",
      href: "/services/space-planning",
      icon: LayoutGrid,
    },
    {
      name: "Property & Facility Management",
      href: "/services/property-development",
      icon: Building2,
    },
    {
      name: "Land & Real Estate Brokerage",
      href: "/services/land-real-estate-brokerage",
      icon: Landmark,
    },
    {
      name: "General Contracts",
      href: "/services/general-contracts",
      icon: FileSignature,
    },
  ];

  $: dashboardHref =
    userRole === "admin"
      ? "/admin"
      : userRole === "agent"
        ? "/dashboard/agent"
        : userRole === "estate_manager"
          ? "/dashboard/manager"
          : "/dashboard/client";

  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }

  function toggleProfileMenu() {
    isProfileMenuOpen = !isProfileMenuOpen;
  }
</script>

<svelte:window
  on:keydown={(event) => {
    if (event.key === "Escape") isMobileMenuOpen = false;
  }}
  on:click={(event) => {
    if (!event.composedPath().includes(headerElement)) isMobileMenuOpen = false;
  }}
/>

<header
  bind:this={headerElement}
  class="sticky top-0 z-40 w-full glass-l2 border-b border-white/10"
>
  <div class="container mx-auto px-4 lg:px-8">
    <div class="flex items-center gap-4 h-20" dir="ltr">
      <!-- Logo -->
      <a
        href="/"
        class="group flex min-h-[64px] items-center"
        aria-label={$adkT("Aliko Diamond Key Realtors Ltd home")}
      >
        <img
          src="/adk-logo.png"
          alt={$adkT("Aliko Diamond Key Realtors Ltd")}
          width="1351"
          height="1164"
          class="h-16 w-auto rounded-lg bg-white object-contain shadow-[0_0_18px_rgba(202,151,35,0.2)] transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </a>

      <div class="ml-auto flex items-center gap-2 sm:gap-3" dir="ltr">
        <LanguageSwitcher />
        <ThemeToggle />
        <!-- Mobile Menu Button -->
        <button
          class="flex items-center justify-center min-h-[44px] min-w-[44px] text-stone-300 hover:text-white"
          aria-label={$adkT(isMobileMenuOpen ? "Close menu" : "Open menu")}
          aria-expanded={isMobileMenuOpen}
          on:click={toggleMobileMenu}
        >
          {#if isMobileMenuOpen}
            <X size={24} />
          {:else}
            <Menu size={24} />
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Mobile Menu Drawer -->
  {#if isMobileMenuOpen}
    <div
      class="mobile-dropdown absolute top-[calc(100%+8px)] right-3 sm:right-6 w-[min(22rem,calc(100vw-24px))] z-50 bg-[#071018] border border-white/15 rounded-2xl shadow-2xl"
      transition:slide={{ duration: 100 }}
    >
      <div
        class="flex flex-col dropdown-scroll p-3 gap-1 max-h-[min(70dvh,640px)] overflow-y-auto overscroll-contain"
        dir={$page.data.locale === "ar" ? "rtl" : "ltr"}
      >
        <div class="flex gap-2">
          <button
            aria-label={$adkT("Go back")}
            class="min-h-[44px] min-w-[44px]"
            on:click={() => window.history.back()}
            ><ArrowLeft size={18} /></button
          ><button
            aria-label={$adkT("Go forward")}
            class="min-h-[44px] min-w-[44px]"
            on:click={() => window.history.forward()}
            ><ArrowRight size={18} /></button
          >
        </div>
        {#each navLinks as link}
          <a
            href={link.href}
            class="px-4 py-3 rounded-lg text-base font-medium {$page.url
              .pathname === link.href
              ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/20'
              : 'text-stone-300 hover:bg-white/5'}"
            on:click={() => (isMobileMenuOpen = false)}
          >
            {$adkT(link.name)}
          </a>
        {/each}

        <div
          class="px-2 pt-3 pb-1 text-xs uppercase font-mono text-stone-500 tracking-wider"
        >
          {$adkT("Services")}
        </div>
        {#each serviceLinks as s}
          <a
            href={s.href}
            class="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-stone-300 hover:bg-white/5"
            on:click={() => (isMobileMenuOpen = false)}
          >
            <s.icon size={15} class="text-emerald-400/80" />
            {$adkT(s.name)}
          </a>
        {/each}

        <div class="h-px bg-white/10 my-4"></div>

        <div
          class="px-2 py-1 text-xs uppercase font-mono text-stone-500 tracking-wider"
        >
          {$adkT("Dashboards")}
        </div>
        <a
          href="/dashboard/manager"
          class="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-stone-300 hover:bg-white/5"
          on:click={() => (isMobileMenuOpen = false)}
        >
          <Building2 size={15} class="text-emerald-400/80" />
          {$adkT("Estate Manager")}
        </a>
        <a
          href="/dashboard/agent"
          class="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-stone-300 hover:bg-white/5"
          on:click={() => (isMobileMenuOpen = false)}
        >
          <Users size={15} class="text-emerald-400/80" />
          {$adkT("Agent Dashboard")}
        </a>
        <a
          href="/dashboard/client"
          class="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-stone-300 hover:bg-white/5"
          on:click={() => (isMobileMenuOpen = false)}
        >
          <Home size={15} class="text-emerald-400/80" />
          {$adkT("Client Portal")}
        </a>

        <div class="h-px bg-white/10 my-2"></div>

        <a
          href="/auth/admin"
          class="px-4 py-3 rounded-lg"
          on:click={() => (isMobileMenuOpen = false)}>{$adkT("Admin Login")}</a
        >

        {#if isLoggedIn}
          <a
            href={dashboardHref}
            on:click={() => (isMobileMenuOpen = false)}
            class="px-4 py-3 rounded-lg">{$adkT("Dashboard")}</a
          >
          <a
            href="/dashboard/account"
            on:click={() => (isMobileMenuOpen = false)}
            class="px-4 py-3 rounded-lg">{$adkT("Profile")}</a
          >
          <a
            href="/dashboard/messages"
            on:click={() => (isMobileMenuOpen = false)}
            class="px-4 py-3 rounded-lg">{$adkT("Conversations")}</a
          >
          <a
            href="/dashboard/payments"
            class="px-4 py-3 rounded-lg"
            on:click={() => (isMobileMenuOpen = false)}
            >{$adkT("My payments")}</a
          >
          <a
            href="/legal/track"
            on:click={() => (isMobileMenuOpen = false)}
            class="px-4 py-3 rounded-lg">{$adkT("Track Documents")}</a
          >
          <button
            class="px-4 py-3 rounded-lg text-base font-medium text-rose-400 hover:bg-rose-500/10 text-left w-full"
            on:click={signOut}>{$adkT("Sign out")}</button
          >
        {:else}
          <div class="flex flex-col gap-3 pt-2">
            <a
              href="/auth?tab=signin"
              class="btn-ghost w-full justify-center"
              on:click={() => (isMobileMenuOpen = false)}>{$adkT("Sign In")}</a
            >
            <a
              href="/auth?tab=signup"
              class="btn-primary w-full justify-center"
              on:click={() => (isMobileMenuOpen = false)}>{$adkT("Register")}</a
            >
          </div>
        {/if}
      </div>
    </div>
  {/if}
</header>
