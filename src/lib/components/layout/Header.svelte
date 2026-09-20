<script lang="ts">
  import { Menu, X, Bell, User, LogOut, Settings, LayoutDashboard, Map as MapIcon, ChevronDown, ChevronRight, Lamp, Building, HardHat, Cpu, Grid3x3, Sofa, Sparkles, FileSignature, Hammer, DraftingCompass, LayoutGrid, Building2, Landmark } from 'lucide-svelte';
  import { slide } from 'svelte/transition';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import DiamondMark from '$lib/components/ui/DiamondMark.svelte';
  import { api } from '$lib/convex/_generated/api';
  import { runMutation } from '$lib/convex/queries';

  export let session: { user?: { name?: string | null; email?: string | null; role?: string; id?: string | null } } | null = null;

  let isMobileMenuOpen = false;
  let isProfileMenuOpen = false;
  let isServicesOpen = false;

  $: isLoggedIn = !!session?.user;
  $: userRole = (session?.user?.role ?? 'client').toLowerCase();
  $: displayName = session?.user?.name || session?.user?.email || 'Account';
  let unreadNotifications = 3;

  async function signOut() {
    try {
      await runMutation(api.auth.signOut, {});
    } catch {
      /* no active session server-side — still clear the client UI */
    }
    isProfileMenuOpen = false;
    isMobileMenuOpen = false;
    await goto('/', { invalidateAll: true });
  }

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Properties', href: '/properties' },
    { name: 'Land Plots', href: '/plots' },
    { name: 'Agents', href: '/agents' },
    { name: 'Map View', href: '/map' }
  ];

  const serviceLinks = [
    { name: 'Interior Design', href: '/services/interior-design', icon: Lamp },
    { name: 'Decoration & Styling', href: '/services/decoration-styling', icon: Sparkles },
    { name: 'Furnishing', href: '/services/furnishing', icon: Sofa },
    { name: 'Renovation & Refurbishing', href: '/services/renovation-refurbishment', icon: Hammer },
    { name: 'Turkish & Foreign Tiles', href: '/services/turkish-tiles-supply', icon: Grid3x3 },
    { name: 'Building Materials', href: '/services/building-materials-supply', icon: HardHat },
    { name: 'Smart Home Installation', href: '/services/smart-home-installation', icon: Cpu },
    { name: 'Construction', href: '/services/construction-services', icon: Building },
    { name: 'Architectural Design', href: '/services/architectural-design', icon: DraftingCompass },
    { name: 'Space Planning & Management', href: '/services/space-planning', icon: LayoutGrid },
    { name: 'Property & Facility Management', href: '/services/property-development', icon: Building2 },
    { name: 'Land & Real Estate Brokerage', href: '/services/land-real-estate-brokerage', icon: Landmark },
    { name: 'General Contracts', href: '/services/general-contracts', icon: FileSignature }
  ];

  $: dashboardHref = userRole === 'admin' ? '/admin' : userRole === 'agent' ? '/dashboard/agent' : userRole === 'estate_manager' ? '/dashboard/manager' : '/dashboard/client';

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
      <a href="/" class="flex items-center gap-3 group">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_15px_rgba(5,150,105,0.4)] group-hover:scale-105 transition-transform duration-300 text-white">
          <DiamondMark size={22} />
        </div>
        <span class="text-xl font-serif font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-stone-400">
          Aliko Diamond Key
        </span>
      </a>

      <!-- Desktop Nav -->
      <nav class="hidden md:flex items-center gap-8">
        {#each navLinks as link}
          <a
            href={link.href}
            class="text-sm font-medium transition-colors hover:text-emerald-400 relative {$page.url.pathname === link.href ? 'text-emerald-400' : 'text-stone-300'}"
          >
            {link.name}
            {#if $page.url.pathname === link.href}
              <div class="absolute -bottom-7 left-0 w-full h-0.5 bg-emerald-500 shadow-[0_0_10px_rgba(5,150,105,0.8)]"></div>
            {/if}
          </a>
        {/each}

        <!-- Services Dropdown -->
        <div class="relative" role="none"
             on:mouseenter={() => (isServicesOpen = true)}
             on:mouseleave={() => (isServicesOpen = false)}>
          <button
            class="flex items-center gap-1 text-sm font-medium transition-colors {isServicesOpen || $page.url.pathname.startsWith('/services') ? 'text-emerald-400' : 'text-stone-300 hover:text-emerald-400'}"
            on:click={() => (isServicesOpen = !isServicesOpen)}
          >
            Services
            <ChevronDown size={14} class="transition-transform {isServicesOpen ? 'rotate-180' : ''}" />
          </button>

          {#if isServicesOpen}
            <div class="absolute right-0 top-full pt-3 z-50" transition:slide={{ duration: 180 }}>
              <div class="w-[34rem] rounded-2xl glass-l3 border border-white/10 shadow-2xl p-3">
                <a href="/services" class="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider text-emerald-400 hover:bg-white/5">
                  All Services <ChevronRight size={12} />
                </a>
                <div class="h-px bg-white/10 my-1"></div>
                <div class="grid grid-cols-2 gap-0.5">
                  {#each serviceLinks as s}
                    <a
                      href={s.href}
                      class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-stone-300 transition-colors hover:bg-white/5 hover:text-white"
                      on:click={() => (isServicesOpen = false)}
                    >
                      <s.icon size={15} class="flex-shrink-0 text-emerald-400/80" />
                      <span class="truncate">{s.name}</span>
                    </a>
                  {/each}
                </div>
              </div>
            </div>
          {/if}
        </div>
      </nav>

      <!-- Desktop Actions -->
      <div class="hidden md:flex items-center gap-4">
        {#if isLoggedIn}
          <button class="relative p-2 rounded-full text-stone-300 hover:text-white hover:bg-white/10 transition-colors">
            <Bell size={20} />
            {#if unreadNotifications > 0}
              <span class="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(225,29,72,0.8)] animate-pulse"></span>
            {/if}
          </button>

          <div class="relative">
            <button class="flex items-center gap-2 p-1 pl-3 pr-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors" on:click={toggleProfileMenu}>
              <span class="text-sm font-medium text-stone-300">{displayName}</span>
              <span class="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/50 bg-emerald-900/40 text-xs font-bold text-emerald-300">
                {displayName[0]?.toUpperCase() ?? 'A'}
              </span>
            </button>

            {#if isProfileMenuOpen}
              <div class="absolute right-0 mt-3 w-56 rounded-xl glass-l3 border border-white/10 shadow-2xl py-2 flex flex-col z-50">
                <div class="px-4 py-2 border-b border-white/10 mb-2">
                  <p class="text-sm font-medium text-white">{session?.user?.name ?? 'Account'}</p>
                  <p class="text-xs text-stone-400">{session?.user?.email ?? ''}</p>
                  <div class="mt-2 badge-agent inline-block capitalize">{userRole.replace('_', ' ')}</div>
                </div>

                <a href={dashboardHref} class="flex items-center gap-3 px-4 py-2 text-sm text-stone-300 hover:text-white hover:bg-white/5 transition-colors">
                  <LayoutDashboard size={16} /> Dashboard
                </a>
                <a href={dashboardHref} class="flex items-center gap-3 px-4 py-2 text-sm text-stone-300 hover:text-white hover:bg-white/5 transition-colors">
                  <User size={16} /> Profile
                </a>
                <a href="/legal/track" class="flex items-center gap-3 px-4 py-2 text-sm text-stone-300 hover:text-white hover:bg-white/5 transition-colors">
                  <Settings size={16} /> Track Documents
                </a>
                <div class="h-px bg-white/10 my-2"></div>
                <button class="flex items-center gap-3 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors w-full text-left" on:click={signOut}>
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            {/if}
          </div>
        {:else}
          <a href="/auth?tab=signin" class="text-sm font-medium text-stone-300 hover:text-white transition-colors px-4 py-2">Sign In</a>
          <a href="/auth?tab=signup" class="btn-primary">Register</a>
        {/if}
      </div>

      <!-- Mobile Menu Button -->
      <button class="md:hidden p-2 text-stone-300 hover:text-white" on:click={toggleMobileMenu}>
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
    <div class="md:hidden absolute top-20 left-0 w-full glass-l3 border-b border-white/10 shadow-2xl" transition:slide={{duration: 300}}>
      <div class="flex flex-col p-4 gap-2 max-h-[70vh] overflow-y-auto">
        {#each navLinks as link}
          <a
            href={link.href}
            class="px-4 py-3 rounded-lg text-base font-medium {$page.url.pathname === link.href ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/20' : 'text-stone-300 hover:bg-white/5'}"
            on:click={() => isMobileMenuOpen = false}
          >
            {link.name}
          </a>
        {/each}

        <div class="px-2 pt-3 pb-1 text-xs uppercase font-mono text-stone-500 tracking-wider">Services</div>
        {#each serviceLinks as s}
          <a
            href={s.href}
            class="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-stone-300 hover:bg-white/5"
            on:click={() => isMobileMenuOpen = false}
          >
            <s.icon size={15} class="text-emerald-400/80" />
            {s.name}
          </a>
        {/each}

        <div class="h-px bg-white/10 my-4"></div>

        <div class="px-2 py-1 text-xs uppercase font-mono text-stone-500 tracking-wider">Dashboards</div>
        <a href="/dashboard/manager" class="px-4 py-2 rounded-lg text-sm text-stone-300 hover:bg-white/5" on:click={() => isMobileMenuOpen = false}>🏢 Estate Manager</a>
        <a href="/dashboard/agent" class="px-4 py-2 rounded-lg text-sm text-stone-300 hover:bg-white/5" on:click={() => isMobileMenuOpen = false}>🤝 Agent Dashboard</a>
        <a href="/dashboard/client" class="px-4 py-2 rounded-lg text-sm text-stone-300 hover:bg-white/5" on:click={() => isMobileMenuOpen = false}>🏠 Client Portal</a>

        <div class="h-px bg-white/10 my-2"></div>

        {#if isLoggedIn}
          <button class="px-4 py-3 rounded-lg text-base font-medium text-rose-400 hover:bg-rose-500/10 text-left w-full" on:click={signOut}>Sign out</button>
        {:else}
          <div class="flex flex-col gap-3 pt-2">
            <a href="/auth?tab=signin" class="btn-ghost w-full justify-center" on:click={() => isMobileMenuOpen = false}>Sign In</a>
            <a href="/auth?tab=signup" class="btn-primary w-full justify-center" on:click={() => isMobileMenuOpen = false}>Register</a>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</header>
