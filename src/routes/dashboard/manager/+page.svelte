<script lang="ts">
  import { page } from "$app/stores";
  import { getI18n } from "$lib/i18n";
  const { locale: adkLocale } = getI18n();

  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();

  import OperationsWorkspace from "$lib/components/dashboard/OperationsWorkspace.svelte";
  const workspaceTabs: Record<string, string> = {
    tenants: "TENANT",
    facility: "WORK_ORDER",
    vendors: "VENDOR",
    documents: "DOCUMENT",
    financials: "EXPENSE",
  };
  import {
    LayoutDashboard,
    Home,
    Users,
    Briefcase,
    DollarSign,
    FileText,
    BarChart2,
    Settings,
    LogOut,
    Bell,
    ChevronDown,
    Search,
    Plus,
    Filter,
    Download,
    AlertTriangle,
    Wrench,
    Clock,
    CheckCircle2,
    Menu,
    X,
    Loader2,
  } from "lucide-svelte";
  import { fly } from "svelte/transition";
  import { useQuery, runMutation } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";

  import StatCard from "$lib/components/dashboard/StatCard.svelte";
  import ActivityFeed from "$lib/components/dashboard/ActivityFeed.svelte";

  // Real records are shown where the backend domain exists. Unimplemented
  // lease, vendor and work-order domains stay empty rather than presenting
  // demonstration customers or financial values as production data.
  const allActiveProperties = useQuery(api.properties.listProperties, {
    activeOnly: true,
    limit: 500,
  });
  const manageableProperties = useQuery(
    api.properties.getManageableProperties,
    {},
  );
  $: totalPropertiesCount = $manageableProperties?.length;
  $: propertyRows = ($manageableProperties ?? []).map((property) => ({
    id: property._id,
    title: property.title,
    type: property.type,
    location: property.location,
    status: property.status,
    price: property.price,
    agent: property.agentId ? "Assigned agent" : "Unassigned",
  }));
  const estateSummary = useQuery(api.estateOperations.summary, {});
  const subscription = useQuery(api.subscriptions.mine, {});
  let agentCursor: string | null = null;
  $: assignedAgents = useQuery(
    $myProfile?.role === "ADMIN" ||
      $subscription?.access.plan === "PROFESSIONAL"
      ? api.estateOperations.assignedAgents
      : null,
    {
      paginationOpts: { cursor: agentCursor, numItems: 20 },
    },
  );
  const finances = useQuery(api.management.myFinancialSummary, {});
  const myProfile = useQuery(api.users.getMyProfile, {});
  let profileName = "";
  let profilePhone = "";
  let profileLoaded = false;
  $: if ($myProfile && !profileLoaded) {
    profileName = $myProfile.name ?? "";
    profilePhone = $myProfile.phone ?? "";
    profileLoaded = true;
  }
  let savingProfile = false;
  let profileSaved = false;
  let profileError = "";
  async function saveProfile(e: Event) {
    e.preventDefault();
    savingProfile = true;
    profileSaved = false;
    profileError = "";
    try {
      await runMutation(api.users.updateMyProfile, {
        name: profileName.trim(),
        phone: profilePhone.trim(),
      } as any);
      profileSaved = true;
    } catch (err) {
      profileError = (err as Error).message ?? "Could not save changes.";
    } finally {
      savingProfile = false;
    }
  }
  import PropertyTable from "$lib/components/dashboard/PropertyTable.svelte";
  import MediaManager from "$lib/components/dashboard/MediaManager.svelte";
  import RevenueChart from "$lib/components/dashboard/RevenueChart.svelte";
  import AgentCard from "$lib/components/agent/AgentCard.svelte";

  function downloadReport() {
    if (!$estateSummary) return;
    const csv =
      "Month,Income NGN,Expenses NGN,Net NGN\r\n" +
      $estateSummary.months
        .map(
          (row) =>
            `${row.month},${row.revenue},${row.expenses},${row.revenue - row.expenses}`,
        )
        .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "adk-estate-monthly-ledger.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  let currentTab = "overview";
  // Mobile drawer — desktop sidebar below is hidden md:flex; on mobile the
  // same navItems render inside this slide-in drawer.
  let isMobileNavOpen = false;

  const MOCK_AGENTS: any[] = [];

  $: REVENUE_DATA = $estateSummary?.months ?? [];

  $: MOCK_PROPERTIES = propertyRows;

  $: MOCK_ACTIVITIES = ($estateSummary?.recent ?? []).map((row) => ({
    ...row,
    user: $myProfile?.name ?? "Your account",
    color: "#34d399",
  }));

  const MOCK_TENANTS: any[] = [];

  const MOCK_DOCS: any[] = [];

  const MOCK_WORK_ORDERS: any[] = [];

  const MOCK_VENDORS: any[] = [];

  const PRIORITY_CLASSES: Record<string, string> = {
    High: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    Medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    Low: "bg-stone-500/15 text-stone-300 border-stone-500/30",
  };
  const STATUS_CLASSES: Record<string, string> = {
    Open: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    Scheduled: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    "In Progress": "bg-amber-500/15 text-amber-300 border-amber-500/30",
    Resolved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "properties", label: "My Properties", icon: Home },
    { id: "tenants", label: "Tenants", icon: Users },
    { id: "facility", label: "Facility & Maintenance", icon: Wrench },
    { id: "agents", label: "My Agents", icon: Briefcase },
    { id: "financials", label: "Financials", icon: DollarSign },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "reports", label: "Reports", icon: BarChart2 },
    { id: "settings", label: "Settings", icon: Settings },
  ];
  $: if (
    $page.url.hash &&
    navItems.some((item) => item.id === $page.url.hash.slice(1))
  )
    currentTab = $page.url.hash.slice(1);
</script>

<div
  class="flex h-[calc(100dvh-58px)] w-full bg-[#050A0E] text-stone-300 font-sans overflow-hidden"
>
  <!-- Sidebar -->
  <aside
    class="w-64 flex-shrink-0 border-r border-white/5 bg-white/[0.02] flex flex-col hidden md:flex"
  >
    <div class="p-6">
      <h1
        class="text-xl font-bold tracking-tight text-white flex items-center gap-2"
      >
        <div
          class="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center"
        >
          <span class="text-white font-bold">{$adkT("A")}</span>
        </div>
        {$adkT("ADK Manager")}
      </h1>

      <div
        class="mt-8 flex items-center gap-3 rounded-xl bg-white/5 p-3 border border-white/5"
      >
        {#if $myProfile?.avatarUrl}<img
            src={$myProfile.avatarUrl}
            alt={$adkT("Your profile")}
            class="h-10 w-10 rounded-full object-cover"
          />{:else}<span
            class="h-10 w-10 rounded-full theme-surface flex items-center justify-center"
            aria-hidden="true">{($myProfile?.name ?? "M").slice(0, 1)}</span
          >{/if}
        <div>
          <p class="text-sm font-medium text-white">
            {$myProfile?.name ?? "Estate Manager"}
          </p>
          <p class="text-xs text-emerald-500">{$adkT("Estate management")}</p>
        </div>
      </div>
    </div>

    <a href="/dashboard/operations" class="theme-text underline mx-6 py-3"
      >{$adkT("Leases and financial ledger")}</a
    >
    <nav class="flex-1 overflow-y-auto px-4 py-4 space-y-1 hide-scrollbar">
      {#each navItems as item}
        <button
          on:click={() => (currentTab = item.id)}
          class="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all {currentTab ===
          item.id
            ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500'
            : 'text-stone-400 hover:bg-white/5 hover:text-white'}"
        >
          <svelte:component this={item.icon} class="h-5 w-5" />
          {$adkT(item.label)}
        </button>
      {/each}
    </nav>

    <div class="p-4 border-t border-white/5">
      <a
        href="/login?signout=1"
        class="w-full flex items-center gap-3 rounded-lg px-4 py-3 min-h-[44px] text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
      >
        <LogOut class="h-5 w-5" />
        {$adkT("Sign Out")}
      </a>
    </div>
  </aside>

  <!-- Mobile drawer -->
  {#if isMobileNavOpen}
    <div class="fixed inset-x-0 top-[58px] bottom-0 z-50 md:hidden">
      <div
        class="absolute inset-0 bg-black/70 backdrop-blur-sm"
        role="presentation"
        on:click={() => (isMobileNavOpen = false)}
      ></div>
      <aside
        class="absolute inset-y-0 left-0 w-[85%] max-w-xs bg-[#0A0F14] border-r border-white/5 flex flex-col overflow-y-auto"
      >
        <div
          class="flex items-center justify-between p-6 border-b border-white/5"
        >
          <h1
            class="text-lg font-bold tracking-tight text-white flex items-center gap-2"
          >
            <div
              class="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center"
            >
              <span class="text-white font-bold">{$adkT("A")}</span>
            </div>
            {$adkT("ADK Manager")}
          </h1>
          <button
            class="flex items-center justify-center w-11 h-11 rounded-xl text-stone-400 active:bg-white/10"
            aria-label={$adkT("Close sidebar")}
            on:click={() => (isMobileNavOpen = false)}
          >
            <X class="w-5 h-5" />
          </button>
        </div>
        <a href="/dashboard/operations" class="theme-text underline mx-6 py-3"
          >{$adkT("Leases and financial ledger")}</a
        >
        <nav class="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {#each navItems as item}
            <button
              on:click={() => {
                currentTab = item.id;
                isMobileNavOpen = false;
              }}
              class="w-full flex items-center gap-3 rounded-lg px-4 py-3 min-h-[44px] text-sm font-medium transition-all {currentTab ===
              item.id
                ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500'
                : 'text-stone-400 hover:bg-white/5 hover:text-white'}"
            >
              <svelte:component this={item.icon} class="h-5 w-5" />
              {$adkT(item.label)}
            </button>
          {/each}
        </nav>
        <div class="p-4 border-t border-white/5">
          <a
            href="/login?signout=1"
            class="w-full flex items-center gap-3 rounded-lg px-4 py-3 min-h-[44px] text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut class="h-5 w-5" />
            {$adkT("Sign Out")}
          </a>
        </div>
      </aside>
    </div>
  {/if}

  <!-- Main Content -->
  <main class="flex-1 flex flex-col h-[calc(100dvh-58px)] overflow-hidden">
    <!-- Header -->
    <header
      class="h-20 flex-shrink-0 border-b border-white/5 bg-[#050A0E]/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 z-10 gap-2"
    >
      <div class="flex items-center gap-2 min-w-0">
        <button
          class="md:hidden flex items-center justify-center w-11 h-11 -ml-2 flex-shrink-0 rounded-full text-stone-300 active:bg-white/10"
          aria-label={$adkT("Open sidebar")}
          on:click={() => (isMobileNavOpen = true)}
        >
          <Menu class="h-6 w-6" />
        </button>
        <h2
          class="text-lg md:text-2xl font-semibold text-white capitalize truncate"
        >
          {$adkT(currentTab.replace("-", " "))}
        </h2>
      </div>

      <div class="flex items-center gap-3 md:gap-6">
        <div class="relative hidden sm:block">
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400"
          />
          <input
            dir="auto"
            type="text"
            placeholder={$adkT("Search...")}
            class="w-64 rounded-full border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          />
        </div>

        <button
          class="relative rounded-full p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:bg-white/10 transition-colors"
        >
          <Bell class="h-5 w-5" />
          <span
            class="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#050A0E]"
          ></span>
        </button>
      </div>
    </header>

    <!-- Scrollable Content Area -->
    <div class="flex-1 overflow-y-auto p-8 hide-scrollbar">
      {#key currentTab}
        <div in:fly={{ y: 10, duration: 220, delay: 80 }}>
          {#if workspaceTabs[currentTab]}<OperationsWorkspace
              kind={workspaceTabs[currentTab]}
              title={$adkT(currentTab.replace("-", " "))}
            />{:else if currentTab === "overview"}
            <!-- KPI Row -->
            <div
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <StatCard
                title={$adkT("Total Properties")}
                value={totalPropertiesCount ?? "—"}
                change="Your managed listings"
                changeType="up"
                icon={Home}
              />
              <StatCard
                title={$adkT("Active leases")}
                value={$estateSummary?.activeLeases ?? "—"}
                change="Current recorded lease status"
                changeType="up"
                icon={Users}
                iconBg="bg-blue-500/20"
              />
              <StatCard
                title={$adkT("Ledger expenses (12 months)")}
                value={$finances
                  ? `₦${($estateSummary?.months.reduce((sum, row) => sum + row.expenses, 0) ?? 0).toLocaleString($adkLocale === "ar" ? "ar-NG" : "en-NG")}`
                  : "—"}
                change="Immutable ledger entries"
                changeType="up"
                icon={DollarSign}
                iconBg="bg-emerald-500/20"
              />
              <StatCard
                title={$adkT("Pending Tasks")}
                value={$finances?.workOrders ?? "—"}
                change="Open work orders"
                changeType="down"
                icon={AlertTriangle}
                iconBg="bg-amber-500/20"
              />
            </div>

            <!-- Chart Row -->
            <div class="mb-8">
              <RevenueChart data={REVENUE_DATA} type="area" />
            </div>

            <!-- Bottom Row -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div
                class="lg:col-span-2 rounded-xl border border-white/5 bg-white/[0.02] p-6"
              >
                <h3 class="text-lg font-semibold text-white mb-4">
                  {$adkT("Top Performing Properties")}
                </h3>
                <div class="space-y-4">
                  {#each MOCK_PROPERTIES.slice(0, 3) as prop}
                    <div
                      class="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-colors"
                    >
                      <div>
                        <h4 class="font-medium text-white">
                          {$adkT(prop.title)}
                        </h4>
                        <p class="text-sm text-stone-400">
                          {$adkT(prop.location)}
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="font-medium text-emerald-400">
                          ₦{$adkT((prop.price / 1000000).toFixed(1))}{$adkT(
                            "M",
                          )}
                        </p>
                        <p class="text-xs text-stone-500">
                          {$adkT(prop.status)}
                        </p>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>

              <div class="lg:col-span-1">
                <ActivityFeed activities={MOCK_ACTIVITIES} />
              </div>
            </div>
          {:else if currentTab === "properties"}
            <MediaManager
              mode="property"
              title={$adkT("Upload estate and property images")}
            />
            <PropertyTable properties={propertyRows} />
          {:else if currentTab === "tenants"}
            <div
              class="rounded-xl border border-white/5 bg-[#050A0E]/80 shadow-xl overflow-hidden"
            >
              <div
                class="p-6 border-b border-white/5 flex justify-between items-center"
              >
                <h3 class="text-lg font-semibold text-white">
                  {$adkT("Active Tenants")}
                </h3>
                <button
                  class="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                >
                  <Filter class="w-4 h-4" />
                  {$adkT("Filter")}
                </button>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead class="bg-white/5 text-stone-400">
                    <tr>
                      <th class="px-6 py-4">{$adkT("Tenant")}</th>
                      <th class="px-6 py-4">{$adkT("Property")}</th>
                      <th class="px-6 py-4">{$adkT("Rent Amount")}</th>
                      <th class="px-6 py-4">{$adkT("Lease End")}</th>
                      <th class="px-6 py-4">{$adkT("Status")}</th>
                      <th class="px-6 py-4 text-right">{$adkT("Actions")}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/5">
                    {#each MOCK_TENANTS as t}
                      <tr class="hover:bg-white/5">
                        <td class="px-6 py-4">
                          <div class="text-white font-medium">
                            {$adkT(t.name)}
                          </div>
                          <div class="text-xs text-stone-500">{t.email}</div>
                        </td>
                        <td class="px-6 py-4 text-stone-300"
                          >{$adkT(t.property)}</td
                        >
                        <td class="px-6 py-4 text-white">{$adkT(t.rent)}</td>
                        <td class="px-6 py-4 text-stone-400">{$adkT(t.end)}</td>
                        <td class="px-6 py-4">
                          <span
                            class="px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          >
                            {$adkT(t.status)}
                          </span>
                        </td>
                        <td class="px-6 py-4 text-right">
                          <button
                            class="text-stone-400 hover:text-white px-3 py-1 rounded border border-white/10"
                            >{$adkT("View")}</button
                          >
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          {:else if currentTab === "facility"}
            <div
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <StatCard
                title={$adkT("Open Work Orders")}
                value="3"
                change="1 high priority"
                changeType="down"
                icon={Wrench}
                iconBg="bg-rose-500/20"
              />
              <StatCard
                title={$adkT("Avg. Resolution Time")}
                value="2.4"
                suffix=" days"
                change="-0.6 vs last month"
                changeType="up"
                icon={Clock}
                iconBg="bg-blue-500/20"
              />
              <StatCard
                title={$adkT("Facilities Under Management")}
                value="47"
                change="Across 6 states"
                changeType="up"
                icon={Home}
              />
              <StatCard
                title={$adkT("Active Vendor Contracts")}
                value="12"
                change="+2 this quarter"
                changeType="up"
                icon={CheckCircle2}
                iconBg="bg-emerald-500/20"
              />
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div
                class="lg:col-span-2 rounded-xl border border-white/5 bg-[#050A0E]/80 shadow-xl overflow-hidden"
              >
                <div
                  class="p-6 border-b border-white/5 flex justify-between items-center"
                >
                  <h3 class="text-lg font-semibold text-white">
                    {$adkT("Maintenance Work Orders")}
                  </h3>
                  <button
                    class="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-emerald-500"
                  >
                    <Plus class="w-4 h-4" />
                    {$adkT("New Work Order")}
                  </button>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-sm">
                    <thead class="bg-white/5 text-stone-400">
                      <tr>
                        <th class="px-6 py-4">{$adkT("Issue")}</th>
                        <th class="px-6 py-4">{$adkT("Vendor")}</th>
                        <th class="px-6 py-4">{$adkT("Priority")}</th>
                        <th class="px-6 py-4">{$adkT("Status")}</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5">
                      {#each MOCK_WORK_ORDERS as wo}
                        <tr class="hover:bg-white/5">
                          <td class="px-6 py-4">
                            <div class="text-white font-medium">
                              {$adkT(wo.issue)}
                            </div>
                            <div class="text-xs text-stone-500">
                              {$adkT(wo.property)}
                              {$adkT("· raised")}
                              {$adkT(wo.raised)}
                            </div>
                          </td>
                          <td class="px-6 py-4 text-stone-300"
                            >{$adkT(wo.vendor)}</td
                          >
                          <td class="px-6 py-4">
                            <span
                              class="px-2 py-1 rounded-full text-xs border {PRIORITY_CLASSES[
                                wo.priority
                              ]}">{$adkT(wo.priority)}</span
                            >
                          </td>
                          <td class="px-6 py-4">
                            <span
                              class="px-2 py-1 rounded-full text-xs border {STATUS_CLASSES[
                                wo.status
                              ]}">{$adkT(wo.status)}</span
                            >
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              </div>

              <div
                class="lg:col-span-1 rounded-xl border border-white/5 bg-white/[0.02] p-6"
              >
                <h3 class="text-lg font-semibold text-white mb-4">
                  {$adkT("Vendor Directory")}
                </h3>
                <div class="space-y-3">
                  {#each MOCK_VENDORS as vendor}
                    <div
                      class="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
                    >
                      <div>
                        <p class="text-sm font-medium text-white">
                          {$adkT(vendor.name)}
                        </p>
                        <p class="text-xs text-stone-500">
                          {$adkT(vendor.category)}
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="text-xs text-emerald-400">
                          &#9733; {$adkT(vendor.rating)}
                        </p>
                        <p class="text-xs text-stone-500">
                          {$adkT(vendor.activeOrders)}
                          {$adkT("active")}
                        </p>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {:else if currentTab === "agents"}
            <h3 class="text-lg font-medium text-white mb-4">
              {$adkT("Agents assigned to your managed properties")}
            </h3>
            {#if $assignedAgents === undefined}<p>
                {$adkT("Loading assignments…")}
              </p>{:else if !$assignedAgents.page.length}<p>
                {$adkT("No approved agent assignments on this page.")}
              </p>{/if}
            {#each $assignedAgents?.page ?? [] as agent}<article
                class="theme-surface theme-text border rounded-xl p-4 my-3"
              >
                <p>{$adkT(agent?.name)}</p>
                <p>{$adkT(agent?.property)}</p>
              </article>{/each}
            <button
              class="min-h-[44px] border rounded px-3"
              disabled={!$assignedAgents || $assignedAgents.isDone}
              on:click={() =>
                (agentCursor = $assignedAgents?.continueCursor ?? null)}
              >{$adkT("More assignments")}</button
            >
          {:else if currentTab === "reports"}
            <section
              class="theme-surface theme-text border rounded-xl p-5 space-y-4"
            >
              <h3 class="text-xl font-semibold">
                {$adkT("Recorded estate finance report")}
              </h3>
              <p>
                {$adkT(
                  "Monthly income and expenses come from your immutable NGN ledger. These are recorded transactions; bank settlement and statutory accounting require finance review.",
                )}
              </p>
              <button
                disabled={!$estateSummary}
                on:click={downloadReport}
                class="border rounded px-4 min-h-[44px]"
                >{$adkT("Download monthly CSV")}</button
              >
              <RevenueChart data={REVENUE_DATA} type="bar" />
              <a href="/dashboard/operations" class="underline"
                >{$adkT("Review leases and ledger entries")}</a
              >
            </section>
          {:else}
            <div class="max-w-2xl">
              <form
                class="rounded-xl border border-white/5 bg-white/[0.02] p-6 space-y-6"
                on:submit={saveProfile}
              >
                <h3
                  class="text-lg font-medium text-white border-b border-white/10 pb-4"
                >
                  {$adkT("Profile Settings")}
                </h3>

                {#if $myProfile === undefined}
                  <div class="grid grid-cols-2 gap-4">
                    {#each Array(2) as _}<div
                        class="skeleton h-11 rounded-lg"
                      ></div>{/each}
                  </div>
                {:else}
                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-2">
                      <label for="manager-name" class="text-sm text-stone-400"
                        >{$adkT("Full Name")}</label
                      >
                      <input
                        dir="auto"
                        id="manager-name"
                        type="text"
                        bind:value={profileName}
                        class="w-full min-h-[44px] bg-[#050A0E] border border-white/10 rounded-lg p-2.5 text-white"
                      />
                    </div>
                    <div class="space-y-2">
                      <label for="manager-email" class="text-sm text-stone-400"
                        >{$adkT("Email Address")}</label
                      >
                      <input
                        dir="auto"
                        id="manager-email"
                        type="email"
                        value={$myProfile?.email ?? ""}
                        disabled
                        title={$adkT(
                          "Contact support to change your sign-in email",
                        )}
                        class="w-full min-h-[44px] bg-[#050A0E] border border-white/10 rounded-lg p-2.5 text-stone-500 cursor-not-allowed"
                      />
                    </div>
                    <div class="space-y-2">
                      <label for="manager-phone" class="text-sm text-stone-400"
                        >{$adkT("Phone")}</label
                      >
                      <input
                        dir="auto"
                        id="manager-phone"
                        type="tel"
                        inputmode="tel"
                        bind:value={profilePhone}
                        class="w-full min-h-[44px] bg-[#050A0E] border border-white/10 rounded-lg p-2.5 text-white"
                      />
                    </div>
                  </div>
                {/if}

                {#if profileError}
                  <p
                    class="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300"
                  >
                    {$adkT(profileError)}
                  </p>
                {/if}
                {#if profileSaved}
                  <p
                    class="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300"
                  >
                    {$adkT("Profile updated.")}
                  </p>
                {/if}

                <div class="pt-4">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    class="flex min-h-[44px] items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-60"
                  >
                    {#if savingProfile}<Loader2
                        class="h-4 w-4 animate-spin"
                      />{/if}
                    {$adkT("Save Changes")}
                  </button>
                </div>
              </form>
            </div>
          {/if}
        </div>
      {/key}
    </div>
  </main>
</div>

<style>
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
