<script lang="ts">
  import { useQuery } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { TrendingUp, Map, FileText, MessageSquare, DollarSign, Users, AlertTriangle, CheckCircle, ArrowUpRight, Inbox } from "lucide-svelte";
  import { formatNaira, formatDateTime } from "$lib/utils/format";

  const stats       = useQuery(api.projects.getPlatformStats, {});
  const bookings    = useQuery(api.bookings.getAllBookings, { limit: 8 });
  const pending     = useQuery(api.legalDocuments.getPendingDocuments, {});
  const waQueue     = useQuery(api.whatsapp.getHumanReviewQueue, {});
  const requestStats = useQuery(api.serviceRequests.getStatusCounts, {});
  const newRequests = useQuery(api.serviceRequests.listRequests, { status: "NEW", limit: 5 });

  const KPI_CARDS = [
    { label: "Available Plots", valueKey: "availablePlots", icon: Map,        color: "emerald", href: "/admin/plots" },
    { label: "Total Sold",      valueKey: "soldPlots",      icon: CheckCircle,color: "gold",    href: "/admin/plots" },
    { label: "Active Bookings", valueKey: "totalBookings",  icon: DollarSign, color: "blue",    href: "/admin/bookings" },
    { label: "Total Clients",   valueKey: "totalClients",   icon: Users,      color: "purple",  href: "/admin/users" },
  ];

  const COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
    emerald: { bg: "rgba(5,150,105,0.1)",  border: "rgba(5,150,105,0.2)",  text: "#34d399" },
    gold:    { bg: "rgba(217,119,6,0.1)",  border: "rgba(217,119,6,0.2)",  text: "#f59e0b" },
    blue:    { bg: "rgba(37,99,235,0.1)",  border: "rgba(37,99,235,0.2)",  text: "#93c5fd" },
    purple:  { bg: "rgba(124,58,237,0.1)", border: "rgba(124,58,237,0.2)", text: "#c4b5fd" },
  };

  const STATUS_COLORS: Record<string, string> = {
    SUCCESS: "text-emerald-400",
    PARTIAL: "text-amber-400",
    PENDING: "text-stone-400",
    FAILED:  "text-rose-400",
  };
</script>

<svelte:head><title>Admin Dashboard — Aliko Diamond Key</title></svelte:head>

<div class="p-8">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-xl font-bold text-white">Dashboard</h1>
      <p class="text-stone-500 text-sm mt-0.5">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
    </div>
    {#if $stats?.unverifiedPlots}
      <a href="/admin/plots" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-amber-400"
         style="background: rgba(217,119,6,0.1); border: 1px solid rgba(217,119,6,0.2)">
        <AlertTriangle class="w-4 h-4" /> {$stats.unverifiedPlots} plots need verification
      </a>
    {/if}
  </div>

  <!-- KPI Cards -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
    {#each KPI_CARDS as { label, valueKey, icon: Icon, color, href }}
      {@const colors = COLOR_MAP[color]}
      {@const value = $stats ? ($stats as Record<string, number>)[valueKey] : null}
      <a {href} class="group rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02]"
         style="background: {colors.bg}; border: 1px solid {colors.border}">
        <div class="flex items-start justify-between mb-4">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center"
               style="background: rgba(255,255,255,0.06)">
            <Icon class="w-5 h-5" style="color: {colors.text}" />
          </div>
          <ArrowUpRight class="w-4 h-4 text-stone-700 group-hover:text-stone-400 transition-colors" />
        </div>
        {#if value === null}
          <div class="skeleton h-7 w-16 rounded mb-1" />
        {:else}
          <p class="font-black text-2xl" style="color: {colors.text}">{value.toLocaleString()}</p>
        {/if}
        <p class="text-stone-500 text-xs mt-1">{label}</p>
      </a>
    {/each}
  </div>

  <!-- Service Requests KPI strip -->
  {#if $requestStats}
    <a href="/admin/requests" class="group rounded-2xl p-5 mb-8 flex items-center gap-4 transition-all hover:scale-[1.01]"
       style="background: linear-gradient(135deg, rgba(37,99,235,0.12), rgba(5,150,105,0.08)); border: 1px solid rgba(37,99,235,0.25)">
      <div class="w-11 h-11 rounded-xl flex items-center justify-center" style="background: rgba(37,99,235,0.18)">
        <Inbox class="w-5 h-5 text-blue-300" />
      </div>
      <div>
        <p class="text-stone-300 text-sm font-semibold">Service Requests Inbox</p>
        <p class="text-stone-500 text-xs">{$requestStats.total} total · {$requestStats.counts.NEW} new · {$requestStats.counts.QUOTED} quoted · {$requestStats.counts.IN_PROGRESS} in progress</p>
      </div>
      <div class="ml-auto text-right">
        <p class="text-blue-300 font-black text-xl">{$requestStats.counts.NEW}</p>
        <p class="text-stone-600 text-xs">awaiting action</p>
      </div>
      <ArrowUpRight class="w-5 h-5 text-stone-600 group-hover:text-blue-300 transition-colors" />
    </a>
  {/if}

  <!-- Revenue card -->
  {#if $stats}
    <div class="rounded-2xl p-5 mb-8 flex items-center gap-4"
         style="background: linear-gradient(135deg, rgba(5,150,105,0.1), rgba(6,78,59,0.15)); border: 1px solid rgba(5,150,105,0.2)">
      <TrendingUp class="w-8 h-8 text-emerald-400 flex-shrink-0" />
      <div>
        <p class="text-stone-400 text-sm">Total transaction value</p>
        <p class="text-white font-black text-2xl">{formatNaira($stats.totalTransactionValue)}</p>
      </div>
      <div class="ml-auto text-right">
        <p class="text-stone-400 text-xs">{$stats.successfulBookings} successful bookings</p>
        <p class="text-emerald-400 text-sm font-semibold mt-0.5">{$stats.activeProjects} active projects</p>
      </div>
    </div>
  {/if}

  <!-- 2-col layout -->
  <div class="grid lg:grid-cols-2 gap-6">
    <!-- Recent Service Requests -->
    <div class="rounded-2xl overflow-hidden" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
      <div class="px-5 py-4 flex items-center justify-between" style="border-bottom: 1px solid rgba(255,255,255,0.06)">
        <h2 class="font-semibold text-white text-sm">Latest Service Requests</h2>
        <a href="/admin/requests" class="text-xs text-emerald-400 hover:text-emerald-300">View all →</a>
      </div>
      <div class="divide-y" style="border-color: rgba(255,255,255,0.04)">
        {#if $newRequests === undefined}
          {#each Array(4) as _}
            <div class="px-5 py-3 flex items-center gap-3">
              <div class="skeleton h-4 flex-1 rounded" />
            </div>
          {/each}
        {:else if $newRequests.length === 0}
          <p class="px-5 py-6 text-stone-600 text-sm text-center">No pending service requests.</p>
        {:else}
          {#each $newRequests.slice(0, 5) as req}
            <a href="/admin/requests?id={req._id}" class="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors">
              <div class="flex-1 min-w-0">
                <p class="text-white text-xs font-medium truncate">{req.requesterName} · {req.requestType.replace(/_/g, " ")}</p>
                <p class="text-stone-600 text-xs truncate">{req.reference} · {req.serviceSlug}</p>
              </div>
              <span class="text-xs font-semibold text-blue-300">NEW</span>
            </a>
          {/each}
        {/if}
      </div>
    </div>

    <!-- Bookings + Documents + WhatsApp -->
    <div class="space-y-4">
      <div class="rounded-2xl overflow-hidden" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
        <div class="px-5 py-4 flex items-center justify-between" style="border-bottom: 1px solid rgba(255,255,255,0.06)">
          <h2 class="font-semibold text-white text-sm">Recent Bookings</h2>
          <a href="/admin/bookings" class="text-xs text-emerald-400 hover:text-emerald-300">View all →</a>
        </div>
        {#if $bookings === undefined}
          <div class="px-5 py-3"><div class="skeleton h-4 w-2/3 rounded" /></div>
        {:else if $bookings.length === 0}
          <p class="px-5 py-5 text-stone-600 text-sm text-center">No bookings yet.</p>
        {:else}
          <div class="divide-y" style="border-color: rgba(255,255,255,0.04)">
            {#each $bookings.slice(0, 3) as booking}
              <div class="px-5 py-3 flex items-center gap-3">
                <div class="flex-1 min-w-0">
                  <p class="text-white text-xs font-medium truncate">{booking.client?.name ?? "—"}</p>
                  <p class="text-stone-600 text-xs">Beacon {booking.plot?.beaconNumber ?? "—"} · {formatNaira(booking.totalAmount)}</p>
                </div>
                <span class="text-xs font-semibold {STATUS_COLORS[booking.paymentStatus]}">{booking.paymentStatus}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Pending docs -->
      <div class="rounded-2xl overflow-hidden" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
        <div class="px-5 py-4 flex items-center justify-between" style="border-bottom: 1px solid rgba(255,255,255,0.06)">
          <div class="flex items-center gap-2">
            <FileText class="w-4 h-4 text-amber-400" />
            <h2 class="font-semibold text-white text-sm">Documents Awaiting Action</h2>
          </div>
          <a href="/admin/documents" class="text-xs text-emerald-400 hover:text-emerald-300">View all →</a>
        </div>
        {#if !$pending || $pending.length === 0}
          <p class="px-5 py-5 text-stone-600 text-sm text-center">All documents are current.</p>
        {:else}
          <div class="divide-y" style="border-color: rgba(255,255,255,0.04)">
            {#each $pending.slice(0, 3) as doc}
              <div class="flex items-center gap-3 px-5 py-3">
                <div class="flex-1 min-w-0">
                  <p class="text-white text-xs font-medium">{doc.type.replace(/_/g, " ")}</p>
                  <p class="text-stone-600 text-xs truncate">{doc.client?.name ?? "—"} · {doc.referenceCode}</p>
                </div>
                <span class="text-xs font-semibold text-amber-400">{doc.status.replace("_", " ")}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- WhatsApp queue -->
      <div class="rounded-2xl overflow-hidden" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
        <div class="px-5 py-4 flex items-center justify-between" style="border-bottom: 1px solid rgba(255,255,255,0.06)">
          <div class="flex items-center gap-2">
            <MessageSquare class="w-4 h-4 text-emerald-400" />
            <h2 class="font-semibold text-white text-sm">WhatsApp Queue</h2>
          </div>
          <a href="/admin/whatsapp" class="text-xs text-emerald-400 hover:text-emerald-300">View all →</a>
        </div>
        {#if !$waQueue || $waQueue.length === 0}
          <p class="px-5 py-5 text-stone-600 text-sm text-center">No sessions awaiting review.</p>
        {:else}
          <div class="divide-y" style="border-color: rgba(255,255,255,0.04)">
            {#each $waQueue.slice(0, 3) as session}
              <div class="flex items-center justify-between px-5 py-3">
                <div>
                  <p class="text-white text-xs font-medium">{session.phone}</p>
                  <p class="text-stone-600 text-xs">State: {session.state}</p>
                </div>
                <a href="https://wa.me/{session.phone.replace(/[^0-9]/g,'')}" target="_blank"
                   class="text-xs font-medium px-2.5 py-1.5 rounded-lg text-white hover:opacity-80 transition-opacity"
                   style="background:rgba(5,150,105,0.2)">Open ↗</a>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
