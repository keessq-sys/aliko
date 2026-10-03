<script lang="ts">
  import { getI18n } from "$lib/i18n";
  const { locale: adkLocale } = getI18n();

  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();

  import OperationsWorkspace from "$lib/components/dashboard/OperationsWorkspace.svelte";
  const workspaceTabs: Record<string, string> = {
    referrals: "REFERRAL",
    messages: "MESSAGE",
    commissions: "COMMISSION",
  };
  import {
    LayoutDashboard,
    Home,
    Users,
    DollarSign,
    Calendar,
    MessageSquare,
    Settings,
    LogOut,
    Bell,
    Plus,
    Phone,
    Mail,
    Gift,
    Send,
    CheckCircle2,
    Clock,
    Menu,
    X,
    Loader2,
  } from "lucide-svelte";
  import { fly } from "svelte/transition";
  import { useQuery, runMutation } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";

  // Mobile drawer — desktop sidebar below is hidden md:flex; on mobile the
  // same navItems render inside this slide-in drawer.
  let isMobileNavOpen = false;

  // ── Real data. Lead assignment, viewing scheduling and commission
  // tracking have no backend concept yet (see the audit in session
  // history), so those stat cards show "coming soon" rather than a
  // fabricated number — only listing count and profile are real here. ───
  const myListingsCount = useQuery(api.properties.getMyPropertiesCount, {});
  const myListings = useQuery(api.properties.getManageableProperties, {});
  const myAssignedEnquiries = useQuery(api.enquiries.listMyAssignedEnquiries, {
    limit: 100,
  });
  const myAssignedVisits = useQuery(
    api.clientPortal.getMyAssignedSiteVisits,
    {},
  );
  $: listingRows = ($myListings ?? []).map((property) => ({
    id: property._id,
    title: property.title,
    type: property.type,
    location: property.location,
    status: property.status,
    price: property.price,
    agent: $myProfile?.name ?? "Current agent",
  }));
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

  import StatCard from "$lib/components/dashboard/StatCard.svelte";
  import RevenueChart from "$lib/components/dashboard/RevenueChart.svelte";
  import LeadsTable from "$lib/components/dashboard/LeadsTable.svelte";
  import PropertyTable from "$lib/components/dashboard/PropertyTable.svelte";
  import MediaManager from "$lib/components/dashboard/MediaManager.svelte";
  import {
    SERVICE_CATEGORY_META,
    REQUEST_STATUS_META,
  } from "$lib/types/services";

  let currentTab = "overview";

  $: MOCK_LEADS = ($myAssignedEnquiries ?? []).map((lead) => ({
    id: lead._id,
    name: "Company-managed enquiry",
    email: "Contact the company desk",
    phone: "Private",
    propertyInterest:
      lead.property?.title ??
      lead.project?.name ??
      lead.plot?.beaconNumber ??
      "General property enquiry",
    source: lead.source ?? "Website",
    status: lead.status.toLowerCase(),
    date: new Date(lead.createdAt).toLocaleDateString($adkLocale === "ar" ? "ar-NG" : "en-NG"),
    value: lead.property?.price ?? lead.plot?.price ?? 0,
  }));

  const COMMISSION_DATA: {
    month: string;
    revenue: number;
    expenses: number;
  }[] = [];

  $: VIEWINGS = ($myAssignedVisits ?? []).map((visit) => ({
    client: visit.client?.name ?? "Client",
    property: visit.property?.title ?? visit.project?.name ?? "Site visit",
    time: `${new Date(visit.requestedAt).toLocaleDateString($adkLocale === "ar" ? "ar-NG" : "en-NG")} · ${visit.preferredTime}`,
    status: visit.status[0] + visit.status.slice(1).toLowerCase(),
  }));

  // Service referrals: when an agent closes a sale, they refer the client
  // into ADK's own services catalog (interior design, renovation, smart
  // home, etc.) and earn a referral commission on the resulting request.
  const MOCK_REFERRALS: {
    id: string;
    client: string;
    service: string;
    category: string;
    status: string;
    value: number;
    date: string;
  }[] = [];

  const MOCK_MESSAGES: {
    id: string;
    from: string;
    preview: string;
    time: string;
    unread: boolean;
  }[] = [];

  const REFERRAL_COMMISSION_RATE = 0.05; // 5% of completed service value

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "listings", label: "My Listings", icon: Home },
    { id: "leads", label: "My Leads", icon: Users },
    { id: "referrals", label: "Service Referrals", icon: Gift },
    { id: "commissions", label: "Commissions", icon: DollarSign },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "settings", label: "Settings", icon: Settings },
  ];
</script>

<div
  class="flex h-screen w-full bg-[#050A0E] text-stone-300 font-sans overflow-hidden"
>
  <!-- Sidebar (desktop) -->
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
        </div> {$adkT("Agent Portal")} </h1>

      <div
        class="mt-8 flex items-center gap-3 rounded-xl bg-white/5 p-3 border border-white/5"
      >
        <img
          src="https://picsum.photos/seed/agent/100/100"
          alt={$adkT("Agent")}
          class="h-10 w-10 rounded-full object-cover"
        />
        <div>
          <p class="text-sm font-medium text-white">
            {$myProfile?.name ?? "Agent account"}
          </p>
          <p class="text-xs text-stone-400">
            {$myProfile?.email ?? "Aliko Diamond Key"}
          </p>
        </div>
      </div>
    </div>

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
        <LogOut class="h-5 w-5" /> {$adkT("Sign Out")} </a>
    </div>
  </aside>

  <!-- Mobile drawer -->
  {#if isMobileNavOpen}
    <div class="fixed inset-0 z-50 md:hidden">
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
            </div> {$adkT("Agent Portal")} </h1>
          <button
            class="flex items-center justify-center w-11 h-11 rounded-xl text-stone-400 active:bg-white/10"
            aria-label={$adkT("Close menu")}
            on:click={() => (isMobileNavOpen = false)}
          >
            <X class="w-5 h-5" />
          </button>
        </div>
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
            <LogOut class="h-5 w-5" /> {$adkT("Sign Out")} </a>
        </div>
      </aside>
    </div>
  {/if}

  <main class="flex-1 flex flex-col h-screen overflow-hidden">
    <header
      class="h-20 flex-shrink-0 border-b border-white/5 bg-[#050A0E]/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 z-10 gap-2"
    >
      <div class="flex items-center gap-2 min-w-0">
        <button
          class="md:hidden flex items-center justify-center w-11 h-11 -ml-2 flex-shrink-0 rounded-full text-stone-300 active:bg-white/10"
          aria-label={$adkT("Open menu")}
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
      <button
        class="relative rounded-full p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:bg-white/10"
      >
        <Bell class="h-5 w-5" />
      </button>
    </header>

    <div class="flex-1 overflow-y-auto p-8 hide-scrollbar">
      {#key currentTab}
        <div in:fly={{ y: 10, duration: 220, delay: 80 }}>
          {#if workspaceTabs[currentTab]}<OperationsWorkspace
              kind={workspaceTabs[currentTab]}
              title={$adkT(currentTab.replace("-", " "))}
            />{:else if currentTab === "overview"}
            <div
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <StatCard
                title={$adkT("Active Listings")}
                value={$myListingsCount ?? "—"}
                change="Assigned to you"
                changeType="up"
                icon={Home}
              />
              <StatCard
                title={$adkT("New Leads")}
                value={$myAssignedEnquiries?.length ?? "—"}
                change="Assigned enquiries"
                changeType="up"
                icon={Users}
                iconBg="bg-blue-500/20"
              />
              <StatCard
                title={$adkT("Viewings Scheduled")}
                value={$myAssignedVisits?.length ?? "—"}
                change="Assigned site visits"
                changeType="up"
                icon={Calendar}
                iconBg="bg-purple-500/20"
              />
              <StatCard
                title={$adkT("Commission Earned")}
                value={$finances
                  ? `₦${$finances.commission.toLocaleString($adkLocale === "ar" ? "ar-NG" : "en-NG")}`
                  : "—"}
                change="Approved paid commissions"
                changeType="up"
                icon={DollarSign}
                iconBg="bg-emerald-500/20"
              />
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div class="lg:col-span-2">
                <RevenueChart data={COMMISSION_DATA} type="bar" />
              </div>

              <!-- Schedule mini-view -->
              <div class="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                <h3 class="text-lg font-semibold text-white mb-4"> {$adkT("Today's Schedule")} </h3>
                <div class="space-y-4">
                  {#each VIEWINGS as view}
                    <div
                      class="p-4 rounded-lg bg-white/5 border border-white/5"
                    >
                      <div class="flex justify-between items-start mb-2">
                        <span class="text-emerald-400 text-sm font-medium"
                          >{$adkT(view.time)}</span
                        >
                        <span
                          class="text-xs px-2 py-1 rounded bg-stone-800 text-stone-300"
                          >{$adkT(view.status)}</span
                        >
                      </div>
                      <h4 class="text-white font-medium">{$adkT(view.client)}</h4>
                      <p class="text-sm text-stone-400">{$adkT(view.property)}</p>
                    </div>
                  {/each}
                  <button
                    class="w-full py-2 text-sm text-stone-400 hover:text-white border border-white/10 rounded-lg"
                    >{$adkT("View Full Calendar")}</button
                  >
                </div>
              </div>
            </div>

            <div>
              <h3 class="text-lg font-semibold text-white mb-4"> {$adkT("Recent Leads")} </h3>
              <LeadsTable leads={MOCK_LEADS.slice(0, 3)} />
            </div>
          {:else if currentTab === "leads"}
            <div class="mb-6 flex justify-between">
              <h3 class="text-xl font-medium text-white">{$adkT("Lead Pipeline")}</h3>
              <button
                class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex gap-2"
                ><Plus class="w-4 h-4" /> {$adkT("Add Lead")}</button
              >
            </div>
            <LeadsTable leads={MOCK_LEADS} />
          {:else if currentTab === "listings"}
            <div class="mb-6 flex justify-between items-center">
              <h3 class="text-xl font-medium text-white">{$adkT("My Listings")}</h3>
            </div>
            <MediaManager
              mode="property"
              title={$adkT("Upload images to my listings")}
            />
            <PropertyTable properties={listingRows} />
          {:else if currentTab === "referrals"}
            <div
              class="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4"
            >
              <div>
                <h3 class="text-xl font-medium text-white"> {$adkT("Service Referrals")} </h3>
                <p class="text-sm text-stone-400 mt-1"> {$adkT("Refer closed-sale clients into ADK's interior design, renovation, smart-home and construction services — earn")} {$adkT((
                    REFERRAL_COMMISSION_RATE * 100
                  ).toFixed(0))}{$adkT("% on every completed request.")} </p>
              </div>
              <a
                href="/services"
                class="flex-shrink-0 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                <Send class="w-4 h-4" /> {$adkT("New Referral")} </a>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                title={$adkT("Active Referrals")}
                value={MOCK_REFERRALS.filter((r) => r.status !== "COMPLETED")
                  .length}
                change="Across 4 clients"
                changeType="up"
                icon={Gift}
                iconBg="bg-purple-500/20"
              />
              <StatCard
                title={$adkT("Referral Earnings")}
                value={(
                  MOCK_REFERRALS.reduce(
                    (s, r) =>
                      s +
                      (r.status === "COMPLETED"
                        ? r.value * REFERRAL_COMMISSION_RATE
                        : 0),
                    0,
                  ) / 1000
                ).toFixed(0)}
                prefix="₦"
                suffix="K"
                change="This quarter"
                changeType="up"
                icon={DollarSign}
                iconBg="bg-emerald-500/20"
              />
              <StatCard
                title={$adkT("Pipeline Value")}
                value={(
                  MOCK_REFERRALS.reduce((s, r) => s + r.value, 0) / 1000000
                ).toFixed(1)}
                prefix="₦"
                suffix="M"
                change="Quoted + in progress"
                changeType="up"
                icon={CheckCircle2}
                iconBg="bg-blue-500/20"
              />
            </div>

            <div
              class="rounded-xl border border-white/5 bg-[#050A0E]/80 shadow-xl overflow-hidden"
            >
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead class="bg-white/5 text-stone-400">
                    <tr>
                      <th class="px-6 py-4">{$adkT("Client")}</th>
                      <th class="px-6 py-4">{$adkT("Service")}</th>
                      <th class="px-6 py-4">{$adkT("Est. Value")}</th>
                      <th class="px-6 py-4">{$adkT("Status")}</th>
                      <th class="px-6 py-4">{$adkT("Referred")}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/5">
                    {#each MOCK_REFERRALS as r}
                      <tr class="hover:bg-white/5">
                        <td class="px-6 py-4 text-white font-medium"
                          >{$adkT(r.client)}</td
                        >
                        <td class="px-6 py-4">
                          <span class="text-stone-300">{$adkT(r.service)}</span>
                          <span
                            class="block text-xs {SERVICE_CATEGORY_META[
                              r.category
                            ]?.color ?? 'text-stone-500'}"
                            >{$adkT(SERVICE_CATEGORY_META[r.category]?.label ??
                              r.category)}</span
                          >
                        </td>
                        <td class="px-6 py-4 text-stone-300"
                          >{$adkT(r.value > 0
                            ? `₦${(r.value / 1000000).toFixed(1)}M`
                            : "—")}</td
                        >
                        <td class="px-6 py-4">
                          <span
                            class="px-2 py-1 rounded-full text-xs {REQUEST_STATUS_META[
                              r.status
                            ]?.classes}"
                            >{$adkT(REQUEST_STATUS_META[r.status]?.label ??
                              r.status)}</span
                          >
                        </td>
                        <td class="px-6 py-4 text-stone-500">{$adkT(r.date)}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          {:else if currentTab === "commissions"}
            <div class="space-y-6">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard
                  title={$adkT("YTD Commission")}
                  value="10.9"
                  prefix="₦"
                  suffix="M"
                  change="+22%"
                  changeType="up"
                  icon={DollarSign}
                  iconBg="bg-emerald-500/20"
                />
                <StatCard
                  title={$adkT("This Month")}
                  value="1.8"
                  prefix="₦"
                  suffix="M"
                  change="+18%"
                  changeType="up"
                  icon={DollarSign}
                />
                <StatCard
                  title={$adkT("Pending Payout")}
                  value="640"
                  prefix="₦"
                  suffix="K"
                  change="Next payout Oct 1"
                  changeType="up"
                  icon={Clock}
                  iconBg="bg-amber-500/20"
                />
              </div>
              <div class="p-6 rounded-xl border border-white/5 bg-white/[0.02]">
                <h3 class="text-lg font-semibold text-white mb-4"> {$adkT("Commission History")} </h3>
                <RevenueChart data={COMMISSION_DATA} type="bar" />
              </div>
            </div>
          {:else if currentTab === "schedule"}
            <div class="mb-6 flex justify-between items-center">
              <h3 class="text-xl font-medium text-white">{$adkT("Upcoming Viewings")}</h3>
              <button
                class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex gap-2 text-sm"
                ><Plus class="w-4 h-4" /> {$adkT("Schedule Viewing")}</button
              >
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {#each VIEWINGS as view}
                <div class="p-4 rounded-lg bg-white/5 border border-white/5">
                  <div class="flex justify-between items-start mb-2">
                    <span class="text-emerald-400 text-sm font-medium"
                      >{$adkT(view.time)}</span
                    >
                    <span
                      class="text-xs px-2 py-1 rounded bg-stone-800 text-stone-300"
                      >{$adkT(view.status)}</span
                    >
                  </div>
                  <h4 class="text-white font-medium">{$adkT(view.client)}</h4>
                  <p class="text-sm text-stone-400">{$adkT(view.property)}</p>
                </div>
              {/each}
            </div>
          {:else if currentTab === "messages"}
            <div
              class="rounded-xl border border-white/5 bg-[#050A0E]/80 shadow-xl divide-y divide-white/5 overflow-hidden"
            >
              {#each MOCK_MESSAGES as msg}
                <div
                  class="flex items-start gap-4 p-5 hover:bg-white/5 transition-colors"
                >
                  <div
                    class="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-emerald-900/40 text-emerald-300 font-semibold text-sm"
                  >
                    {$adkT(msg.from[0])}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                      <p class="text-white font-medium text-sm">{$adkT(msg.from)}</p>
                      <span class="text-xs text-stone-500">{$adkT(msg.time)}</span>
                    </div>
                    <p class="text-sm text-stone-400 truncate mt-0.5">
                      {$adkT(msg.preview)}
                    </p>
                  </div>
                  {#if msg.unread}
                    <span
                      class="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-2"
                    ></span>
                  {/if}
                </div>
              {/each}
            </div>
          {:else}
            <div class="max-w-2xl">
              <form
                class="rounded-xl border border-white/5 bg-white/[0.02] p-6 space-y-6"
                on:submit={saveProfile}
              >
                <h3
                  class="text-lg font-medium text-white border-b border-white/10 pb-4"
                > {$adkT("Profile Settings")} </h3>
                {#if $myProfile === undefined}
                  <div class="grid grid-cols-2 gap-4">
                    {#each Array(2) as _}<div
                        class="skeleton h-11 rounded-lg"
                      ></div>{/each}
                  </div>
                {:else}
                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-2">
                      <label
                        for="agent-profile-name"
                        class="text-sm text-stone-400">{$adkT("Full Name")}</label
                      >
                      <input dir="auto"
                        id="agent-profile-name"
                        type="text"
                        bind:value={profileName}
                        class="w-full min-h-[44px] bg-[#050A0E] border border-white/10 rounded-lg p-2.5 text-white"
                      />
                    </div>
                    <div class="space-y-2">
                      <label
                        for="agent-profile-email"
                        class="text-sm text-stone-400">{$adkT("Email Address")}</label
                      >
                      <input dir="auto"
                        id="agent-profile-email"
                        type="email"
                        value={$myProfile?.email ?? ""}
                        disabled
                        title={$adkT("Contact support to change your sign-in email")}
                        class="w-full min-h-[44px] bg-[#050A0E] border border-white/10 rounded-lg p-2.5 text-stone-500 cursor-not-allowed"
                      />
                    </div>
                    <div class="space-y-2">
                      <label
                        for="agent-profile-phone"
                        class="text-sm text-stone-400">{$adkT("Phone")}</label
                      >
                      <input dir="auto"
                        id="agent-profile-phone"
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
                  > {$adkT("Profile updated.")} </p>
                {/if}
                <div class="pt-4">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    class="flex min-h-[44px] items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-60"
                  >
                    {#if savingProfile}<Loader2
                        class="h-4 w-4 animate-spin"
                      />{/if} {$adkT("Save Changes")} </button>
                </div>
              </form>
            </div>
          {/if}
        </div>
      {/key}
    </div>
  </main>
</div>
