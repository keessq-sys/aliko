<script lang="ts">
  import { page } from "$app/stores";
  import { useQuery } from "convex-svelte";
  import { api } from "$lib/convex/_generated/api";
  import { Diamond, LayoutDashboard, Map, FolderOpen, FileText, Construction, MessageSquare, Bell, Users, TrendingUp, ChevronRight, LogOut, Settings } from "lucide-svelte";

  export let data: { session?: { user?: { role?: string; name?: string | null } } | null };

  const stats = useQuery(api.projects.getPlatformStats, {});

  const NAV_GROUPS = [
    {
      label: "Overview",
      items: [
        { href: "/admin",               icon: LayoutDashboard, label: "Dashboard" },
        { href: "/admin/notifications", icon: Bell,            label: "Notifications",  badge: null },
      ],
    },
    {
      label: "Properties",
      items: [
        { href: "/admin/projects",   icon: FolderOpen,    label: "Projects & Estates" },
        { href: "/admin/plots",      icon: Map,           label: "Plot Verification",  badge: "unverified" },
      ],
    },
    {
      label: "Legal & Sales",
      items: [
        { href: "/admin/documents",  icon: FileText,    label: "Legal Documents",   badge: "docs" },
        { href: "/admin/whatsapp",   icon: MessageSquare,label: "WhatsApp Queue",   badge: "wa" },
      ],
    },
    {
      label: "Construction",
      items: [
        { href: "/admin/milestones", icon: Construction, label: "Milestones" },
      ],
    },
  ];

  $: isActive = (href: string) =>
    href === "/admin" ? $page.url.pathname === "/admin" : $page.url.pathname.startsWith(href);

  function getBadgeCount(key: string): number | null {
    const s = $stats;
    if (!s) return null;
    if (key === "unverified") return s.unverifiedPlots > 0 ? s.unverifiedPlots : null;
    return null;
  }
</script>

<div class="flex h-screen overflow-hidden" style="background: var(--c-obsidian)">
  <!-- ── Sidebar ── -->
  <aside class="w-60 flex-shrink-0 flex flex-col overflow-y-auto"
         style="background: #0A1628; border-right: 1px solid rgba(255,255,255,0.05)">
    <!-- Brand -->
    <div class="flex items-center gap-2.5 px-5 py-5" style="border-bottom: 1px solid rgba(255,255,255,0.05)">
      <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
           style="background: linear-gradient(135deg, #D97706, #92400E)">
        <Diamond class="w-4 h-4 text-white" />
      </div>
      <div>
        <p class="text-white font-bold text-xs leading-none">Aliko Diamond Key</p>
        <p class="text-amber-600 text-xs mt-0.5">Admin Panel</p>
      </div>
    </div>

    <!-- Stats pills -->
    {#if $stats}
      <div class="px-4 py-3 grid grid-cols-2 gap-2">
        <div class="rounded-lg px-3 py-2 text-center" style="background: rgba(5,150,105,0.1); border: 1px solid rgba(5,150,105,0.15)">
          <p class="text-emerald-400 font-black text-base">{$stats.availablePlots}</p>
          <p class="text-stone-600 text-xs">Available</p>
        </div>
        <div class="rounded-lg px-3 py-2 text-center" style="background: rgba(217,119,6,0.1); border: 1px solid rgba(217,119,6,0.15)">
          <p class="text-amber-400 font-black text-base">{$stats.totalBookings}</p>
          <p class="text-stone-600 text-xs">Bookings</p>
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
            {@const count = badge ? getBadgeCount(badge) : null}
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
