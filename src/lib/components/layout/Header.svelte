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

<header class="sticky top-0 z-40 w-full glass-l2 border-b border-white/10">
  <div class="container mx-auto px-4 lg:px-8">
    <div class="flex items-center justify-between h-20">
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

      <!-- Desktop Actions -->
      <div class="hidden xl:flex items-center gap-3">
        <ThemeToggle />
        <a
          href="/auth/admin"
          class="text-sm font-semibold min-h-[44px] flex items-center"
          >{$adkT("Admin Login")}</a
        >
        {#if isLoggedIn}
          <button
            on:click={signOut}
            class="min-h-[44px] px-3 text-sm font-semibold">{$adkT("Logout")}</button
          >
          <button
            class="relative flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full text-stone-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={$adkT("Notifications")}
          >
            <Bell size={20} />
            {#if unreadNotifications > 0}
              <span
                class="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(225,29,72,0.8)] animate-pulse"
              ></span>
            {/if}
          </button>

          <div class="relative">
            <button
              class="flex items-center gap-2 min-h-[44px] pl-3 pr-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              aria-label={$adkT("Account menu")}
              aria-expanded={isProfileMenuOpen}
              on:click={toggleProfileMenu}
            >
              <span
                class="max-w-[140px] truncate text-sm font-medium text-stone-300"
                >{displayName}</span
              >
              <span
                class="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-500/50 bg-emerald-900/40 text-xs font-bold text-emerald-300"
              >
                {displayName[0]?.toUpperCase() ?? "A"}
              </span>
            </button>

            {#if isProfileMenuOpen}
              <div
                class="absolute right-0 mt-3 w-56 rounded-xl glass-l3 border border-white/10 shadow-2xl py-2 flex flex-col z-50"
              >
                <div class="px-4 py-2 border-b border-white/10 mb-2">
                  <p class="text-sm font-medium text-white">
                    {session?.user?.name ?? "Account"}
                  </p>
                  <p class="text-xs text-stone-400">
                    {session?.user?.email ?? ""}
                  </p>
                  <div class="mt-2 badge-agent inline-block capitalize">
                    {$adkT(userRole.replace("_", " "))}
                  </div>
                </div>

                <a
                  href={dashboardHref}
                  class="flex items-center gap-3 px-4 py-2 text-sm text-stone-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <LayoutDashboard size={16} /> {$adkT("Dashboard")} </a>
                <a
                  href="/dashboard/account"
                  class="flex items-center gap-3 px-4 py-2 text-sm text-stone-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <User size={16} /> {$adkT("Profile")} </a>
                <a
                  href="/dashboard/messages"
                  class="flex items-center gap-3 px-4 py-2 text-sm theme-text min-h-[44px]"
                  >{$adkT("Conversations")}</a
                >
                <a
                  href="/legal/track"
                  class="flex items-center gap-3 px-4 py-2 text-sm text-stone-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Settings size={16} /> {$adkT("Track Documents")} </a>
                <div class="h-px bg-white/10 my-2"></div>
                <button
                  class="flex items-center gap-3 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors w-full text-left"
                  on:click={signOut}
                >
                  <LogOut size={16} /> {$adkT("Sign out")} </button>
              </div>
            {/if}
          </div>
        {:else}
          <a
            href="/auth?tab=signin"
            class="text-sm font-medium text-stone-300 hover:text-white transition-colors px-4 py-2"
            >{$adkT("Sign In")}</a
          >
          <a href="/auth?tab=signup" class="btn-primary">{$adkT("Register")}</a>
        {/if}
      </div>

      <div class="hidden xl:flex items-center" aria-label={$adkT("Page history")}>
        <button
          aria-label={$adkT("Go back")}
          title={$adkT("Go back")}
          class="min-h-[44px] min-w-[44px]"
          on:click={() => window.history.back()}><ArrowLeft size={18} /></button
        >
        <button
          aria-label={$adkT("Go forward")}
          title={$adkT("Go forward")}
          class="min-h-[44px] min-w-[44px]"
          on:click={() => window.history.forward()}
          ><ArrowRight size={18} /></button
        >
      </div>
      <LanguageSwitcher />
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

  <!-- Mobile Menu Drawer -->
  {#if isMobileMenuOpen}
    <div
      class="fixed inset-x-0 bottom-0 top-20 z-30 bg-black/60"
      role="presentation"
      on:click={() => (isMobileMenuOpen = false)}
    ></div>
    <div
      class="absolute top-20 left-0 w-full z-30 bg-[#071018] border-b border-white/15 shadow-2xl"
      transition:slide={{ duration: 300 }}
    >
      <div class="flex flex-col p-4 gap-2 max-h-[70vh] overflow-y-auto">
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
        > {$adkT("Services")} </div>
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
        > {$adkT("Dashboards")} </div>
        <a
          href="/dashboard/manager"
          class="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-stone-300 hover:bg-white/5"
          on:click={() => (isMobileMenuOpen = false)}
        >
          <Building2 size={15} class="text-emerald-400/80" /> {$adkT("Estate Manager")} </a>
        <a
          href="/dashboard/agent"
          class="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-stone-300 hover:bg-white/5"
          on:click={() => (isMobileMenuOpen = false)}
        >
          <Users size={15} class="text-emerald-400/80" /> {$adkT("Agent Dashboard")} </a>
        <a
          href="/dashboard/client"
          class="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-stone-300 hover:bg-white/5"
          on:click={() => (isMobileMenuOpen = false)}
        >
          <Home size={15} class="text-emerald-400/80" /> {$adkT("Client Portal")} </a>

        <div class="h-px bg-white/10 my-2"></div>

        <div
          class="flex items-center justify-between rounded-lg px-4 py-2 text-sm text-stone-300"
        >
          <span>{$adkT("Appearance")}</span><ThemeToggle />
          <a href="/auth/admin" on:click={() => (isMobileMenuOpen = false)}
            >{$adkT("Admin Login")}</a
          >
        </div>

        {#if isLoggedIn}
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
