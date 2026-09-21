<script lang="ts">
  import { page } from "$app/stores";
  import { useQuery } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { LayoutDashboard, Map, FolderOpen, FileText, Construction, MessageSquare, Bell, ChevronRight, LogOut, Settings, Inbox, Building2, Briefcase, Layers, UserCog, Menu, X, DollarSign } from "lucide-svelte";
  import DiamondMark from "$lib/components/ui/DiamondMark.svelte";

  export let data: { session?: { user?: { role?: string; name?: string | null } } | null };

  const stats = useQuery(api.projects.getPlatformStats, {});
  const requestCounts = useQuery(api.serviceRequests.getStatusCounts, {});

  // Mobile drawer — the <aside> below is desktop-only (hidden md:flex); on
  // mobile the exact same NAV_GROUPS render inside this slide-in drawer,
  // opened from the mobile top bar's hamburger button.
  let isMobileNavOpen = false;
  $: if ($page) isMobileNavOpen = false;

  const NAV_GROUPS = [
    {
      label: "Overview",
      items: [
        { href: "/admin",                 icon: LayoutDashboard, label: "Dashboard",        badge: null as string | null },
        { href: "/admin/notifications",   icon: Bell,            label: "Notifications",    badge: null },
      ],
    },
    {
      label: "Service Requests",
      items: [
        { href: "/admin/requests",        icon: Inbox,           label: "Requests Inbox",   badge: "new" },
        { href: "/admin/services",        icon: Layers,          label: "Services Catalog", badge: null },
      ],
    },
    {
      label: "People",
      items: [
        { href: "/admin/agents",          icon: Briefcase,       label: "Agent Approvals",  badge: "agents" },
        { href: "/admin/managers",        icon: Building2,       label: "Manager Approvals",badge: "managers" },
        { href: "/admin/users",           icon: UserCog,         label: "Users & Roles",    badge: null },
      ],
    },
    {
      label: "Properties",
      items: [
        { href: "/admin/projects",        icon: FolderOpen,      label: "Projects & Estates", badge: null },
        { href: "/admin/plots",           icon: Map,             label: "Plot Verification",  badge: "unverified" },
      ],
    },
    {
      label: "Legal & Sales",
      items: [
        { href: "/admin/bookings",        icon: DollarSign,      label: "Bookings",         badge: null },
        { href: "/admin/documents",       icon: FileText,        label: "Legal Documents",  badge: null },
        { href: "/admin/whatsapp",        icon: MessageSquare,   label: "WhatsApp Queue",   badge: null },
      ],
    },
    {
      label: "Construction",
      items: [
        { href: "/admin/milestones",      icon: Construction,    label: "Milestones",       badge: null },
      ],
    },
    {
      label: "System",
      items: [
        { href: "/admin/settings",        icon: Settings,        label: "Settings",         badge: null },
      ],
    },
  ];

  $: isActive = (href: string) =>
    href === "/admin" ? $page.url.pathname === "/admin" : $page.url.pathname.startsWith(href);
</script>

<div class="flex flex-col md:flex-row h-screen overflow-hidden" style="background: var(--c-obsidian)">
  <!-- ── Mobile top bar (hidden on desktop — the sidebar below takes over) ── -->
  <header class="flex md:hidden items-center justify-between px-4 h-16 flex-shrink-0"
          style="background: #0A1628; border-bottom: 1px solid rgba(255,255,255,0.05)">
    <button
      class="flex items-center justify-center w-11 h-11 -ml-2 rounded-xl text-stone-300 active:bg-white/10"
      aria-label="Open admin menu"
      on:click={() => (isMobileNavOpen = true)}
    >
      <Menu class="w-6 h-6" />
    </button>
    <div class="flex items-center gap-2">
      <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
           style="background: linear-gradient(135deg, #D97706, #92400E)">
        <DiamondMark size={14} />
      </div>
      <p class="text-white font-bold text-xs">Super Admin</p>
    </div>
    <a href="/admin/notifications" class="flex items-center justify-center w-11 h-11 -mr-2 rounded-xl text-stone-300 active:bg-white/10" aria-label="Notifications">
      <Bell class="w-5 h-5" />
    </a>
  </header>

  <!-- ── Mobile drawer ── -->
  {#if isMobileNavOpen}
    <div class="fixed inset-0 z-50 md:hidden">
      <div
        class="absolute inset-0 bg-black/70 backdrop-blur-sm"
        role="presentation"
        on:click={() => (isMobileNavOpen = false)}
      ></div>
      <aside class="absolute inset-y-0 left-0 w-[85%] max-w-xs flex flex-col overflow-y-auto"
             style="background: #0A1628">
        <div class="flex items-center justify-between px-5 py-5" style="border-bottom: 1px solid rgba(255,255,255,0.05)">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
                 style="background: linear-gradient(135deg, #D97706, #92400E)">
              <DiamondMark size={16} />
            </div>
            <div>
              <p class="text-white font-bold text-xs leading-none">Aliko Diamond Key</p>
              <p class="text-amber-600 text-xs mt-0.5">Super Admin</p>
            </div>
          </div>
          <button
            class="flex items-center justify-center w-11 h-11 rounded-xl text-stone-400 active:bg-white/10"
            aria-label="Close menu"
            on:click={() => (isMobileNavOpen = false)}
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <nav class="flex-1 px-3 py-3 space-y-5">
          {#each NAV_GROUPS as group}
            <div>
              <p class="px-3 text-stone-700 text-xs font-semibold uppercase tracking-widest mb-1">{group.label}</p>
              {#each group.items as { href, icon: Icon, label, badge }}
                {@const active = isActive(href)}
                {@const count = badge === "new" && $requestCounts && $requestCounts.counts.NEW > 0 ? $requestCounts.counts.NEW : (badge === "unverified" && $stats && $stats.unverifiedPlots > 0 ? $stats.unverifiedPlots : null)}
                <a {href}
                   class="flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 mb-0.5 group min-h-[44px]"
                   class:text-white={active}
                   class:text-stone-500={!active}
                   style={active ? "background: rgba(5,150,105,0.15); border: 1px solid rgba(5,150,105,0.2)" : ""}
                   on:click={() => (isMobileNavOpen = false)}>
                  <Icon class="w-4 h-4 flex-shrink-0 {active ? 'text-emerald-400' : 'text-stone-600'}" />
                  <span class="flex-1">{label}</span>
                  {#if count}
                    <span class="text-xs font-bold px-1.5 py-0.5 rounded-full" style="background:rgba(220,38,38,0.15);color:#f87171">{count}</span>
                  {:else if active}
                    <ChevronRight class="w-3.5 h-3.5 text-emerald-600" />
                  {/if}
                </a>
              {/each}
            </div>
          {/each}
        </nav>

        <div class="px-3 py-4" style="border-top: 1px solid rgba(255,255,255,0.05)">
          {#if data.session?.user}
            <div class="flex items-center gap-2.5 px-3 py-2 mb-2">
              <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                   style="background: linear-gradient(135deg, #059669, #064E3B)">
                {data.session.user.name?.[0] ?? "A"}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-white text-xs font-medium truncate">{data.session.user.name}</p>
                <p class="text-stone-600 text-xs">{data.session.user.role}</p>
              </div>
            </div>
          {/if}
          <a href="/login?signout=1" class="flex items-center gap-2 px-3 py-3 rounded-xl text-stone-600 hover:text-stone-400 text-xs transition-colors min-h-[44px]">
            <LogOut class="w-3.5 h-3.5" /> Sign out
          </a>
        </div>
      </aside>
    </div>
  {/if}

  <!-- ── Sidebar (desktop only) ── -->
  <aside class="hidden md:flex md:flex-col w-60 flex-shrink-0 overflow-y-auto"
         style="background: #0A1628; border-right: 1px solid rgba(255,255,255,0.05)">
    <!-- Brand -->
    <div class="flex items-center gap-2.5 px-5 py-5" style="border-bottom: 1px solid rgba(255,255,255,0.05)">
      <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
           style="background: linear-gradient(135deg, #D97706, #92400E)">
        <DiamondMark size={16} />
      </div>
      <div>
        <p class="text-white font-bold text-xs leading-none">Aliko Diamond Key</p>
        <p class="text-amber-600 text-xs mt-0.5">Super Admin</p>
      </div>
    </div>

    <!-- Stats pills -->
    {#if $requestCounts}
      <div class="px-4 py-3 grid grid-cols-2 gap-2">
        <div class="rounded-lg px-3 py-2 text-center" style="background: rgba(37,99,235,0.12); border: 1px solid rgba(37,99,235,0.2)">
          <p class="text-blue-300 font-black text-base">{$requestCounts.counts.NEW}</p>
          <p class="text-stone-600 text-xs">New Requests</p>
        </div>
        <div class="rounded-lg px-3 py-2 text-center" style="background: rgba(5,150,105,0.1); border: 1px solid rgba(5,150,105,0.15)">
          <p class="text-emerald-400 font-black text-base">{$stats?.availablePlots ?? '—'}</p>
          <p class="text-stone-600 text-xs">Plots</p>
        </div>
      </div>
    {/if}

    <!-- Nav -->
    <nav class="flex-1 px-3 py-2 space-y-5">
      {#each NAV_GROUPS as group}
        <div>
          <p class="px-3 text-stone-700 text-xs font-semibold uppercase tracking-widest mb-1">{group.label}</p>
          {#each group.items as { href, icon: Icon, label, badge }}
            {@const active = isActive(href)}
            {@const count = badge === "new" && $requestCounts && $requestCounts.counts.NEW > 0 ? $requestCounts.counts.NEW : (badge === "unverified" && $stats && $stats.unverifiedPlots > 0 ? $stats.unverifiedPlots : null)}
            <a {href}
               class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 mb-0.5 group"
               class:text-white={active}
               class:text-stone-500={!active}
               style={active ? "background: rgba(5,150,105,0.15); border: 1px solid rgba(5,150,105,0.2)" : ""}>
              <Icon class="w-4 h-4 flex-shrink-0 {active ? 'text-emerald-400' : 'text-stone-600 group-hover:text-stone-400'}" />
              <span class="flex-1">{label}</span>
              {#if count}
                <span class="text-xs font-bold px-1.5 py-0.5 rounded-full" style="background:rgba(220,38,38,0.15);color:#f87171">{count}</span>
              {:else if active}
                <ChevronRight class="w-3.5 h-3.5 text-emerald-600" />
              {/if}
            </a>
          {/each}
        </div>
      {/each}
    </nav>

    <!-- Footer -->
    <div class="px-3 py-4" style="border-top: 1px solid rgba(255,255,255,0.05)">
      {#if data.session?.user}
        <div class="flex items-center gap-2.5 px-3 py-2 mb-2">
          <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
               style="background: linear-gradient(135deg, #059669, #064E3B)">
            {data.session.user.name?.[0] ?? "A"}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white text-xs font-medium truncate">{data.session.user.name}</p>
            <p class="text-stone-600 text-xs">{data.session.user.role}</p>
          </div>
        </div>
      {/if}
      <a href="/login?signout=1" class="flex items-center gap-2 px-3 py-2 rounded-xl text-stone-600 hover:text-stone-400 text-xs transition-colors">
        <LogOut class="w-3.5 h-3.5" /> Sign out
      </a>
    </div>
  </aside>

  <!-- ── Main Content ── -->
  <div class="flex-1 overflow-y-auto">
    <slot />
  </div>
</div>
