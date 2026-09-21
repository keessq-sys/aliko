<script lang="ts">
  import {
    LayoutDashboard, Home, Users, DollarSign, Calendar,
    MessageSquare, Settings, LogOut, Bell, Plus, Phone, Mail, Gift, Send, CheckCircle2, Clock, Menu, X
  } from 'lucide-svelte';
  import { fly } from 'svelte/transition';

  // Mobile drawer — desktop sidebar below is hidden md:flex; on mobile the
  // same navItems render inside this slide-in drawer.
  let isMobileNavOpen = false;

  import StatCard from '$lib/components/dashboard/StatCard.svelte';
  import RevenueChart from '$lib/components/dashboard/RevenueChart.svelte';
  import LeadsTable from '$lib/components/dashboard/LeadsTable.svelte';
  import PropertyTable from '$lib/components/dashboard/PropertyTable.svelte';
  import { SERVICE_CATEGORY_META, REQUEST_STATUS_META } from '$lib/types/services';

  let currentTab = 'overview';
  
  const MOCK_LEADS = [
    { id: 'l1', name: 'Amara Eze', email: 'amara@gmail.com', phone: '+2348011111111', propertyInterest: 'Maitama Duplex', source: 'Website', status: 'new', date: '2024-09-18', value: 185_000_000 },
    { id: 'l2', name: 'Biodun Akinwale', email: 'biodun@yahoo.com', phone: '+2348022222222', propertyInterest: 'Wuse 2 Apartment', source: 'WhatsApp', status: 'contacted', date: '2024-09-17', value: 75_000_000 },
    { id: 'l3', name: 'Chisom Obiora', email: 'chisom@hotmail.com', phone: '+2348033333333', propertyInterest: 'Lekki Land Plot', source: 'Referral', status: 'viewing', date: '2024-09-15', value: 35_000_000 },
    { id: 'l4', name: 'David Okafor', email: 'david@outlook.com', phone: '+2348044444444', propertyInterest: 'VI Commercial Space', source: 'Social', status: 'negotiating', date: '2024-09-10', value: 950_000_000 },
    { id: 'l5', name: 'Esther Bello', email: 'esther@gmail.com', phone: '+2348055555555', propertyInterest: 'Asokoro Penthouse', source: 'Walk-in', status: 'closed', date: '2024-09-05', value: 320_000_000 },
  ];

  const COMMISSION_DATA = [
    { month: 'Jan', revenue: 1_200_000, expenses: 0 },
    { month: 'Feb', revenue: 800_000, expenses: 0 },
    { month: 'Mar', revenue: 2_400_000, expenses: 0 },
    { month: 'Apr', revenue: 1_500_000, expenses: 0 },
    { month: 'May', revenue: 3_200_000, expenses: 0 },
    { month: 'Jun', revenue: 1_800_000, expenses: 0 },
  ];

  const VIEWINGS = [
    { client: 'Amara Eze', property: 'Maitama Duplex', time: 'Today, 10:00 AM', status: 'Confirmed' },
    { client: 'Chisom Obiora', property: 'Lekki Land Plot', time: 'Today, 2:30 PM', status: 'Pending' },
    { client: 'Biodun Akinwale', property: 'Wuse 2 Apartment', time: 'Tomorrow, 11:00 AM', status: 'Confirmed' },
    { client: 'Esther Bello', property: 'Asokoro Penthouse', time: 'Fri, 9:00 AM', status: 'Confirmed' },
  ];

  const MOCK_LISTINGS = [
    { id: 'p1', title: 'Maitama Luxury Villa', type: 'Residential', location: 'Maitama, Abuja', status: 'Available', price: 850000000, agent: 'Adaeze Okonkwo' },
    { id: 'p2', title: 'Wuse 2 Apartment', type: 'Apartment', location: 'Wuse 2, Abuja', status: 'Reserved', price: 75000000, agent: 'Adaeze Okonkwo' },
    { id: 'p3', title: 'Lekki Land Plot', type: 'Land', location: 'Lekki, Lagos', status: 'Available', price: 35000000, agent: 'Adaeze Okonkwo' },
    { id: 'p4', title: 'Asokoro Penthouse', type: 'Residential', location: 'Asokoro, Abuja', status: 'Sold', price: 320000000, agent: 'Adaeze Okonkwo' },
  ];

  // Service referrals: when an agent closes a sale, they refer the client
  // into ADK's own services catalog (interior design, renovation, smart
  // home, etc.) and earn a referral commission on the resulting request.
  const MOCK_REFERRALS = [
    { id: 'r1', client: 'Amara Eze', service: 'Interior Design', category: 'INTERIOR', status: 'IN_PROGRESS', value: 1_800_000, date: '3 days ago' },
    { id: 'r2', client: 'Esther Bello', service: 'Smart Home Installation', category: 'SMART_HOME', status: 'QUOTED', value: 4_200_000, date: '1 week ago' },
    { id: 'r3', client: 'David Okafor', service: 'Renovation & Refurbishing', category: 'CONSTRUCTION', status: 'NEW', value: 0, date: '2 days ago' },
    { id: 'r4', client: 'Biodun Akinwale', service: 'Furnishing', category: 'INTERIOR', status: 'COMPLETED', value: 2_600_000, date: '1 month ago' },
  ];

  const MOCK_MESSAGES = [
    { id: 'm1', from: 'Amara Eze', preview: 'Is the Maitama duplex still available for viewing this weekend?', time: '10 min ago', unread: true },
    { id: 'm2', from: 'ADK Admin', preview: 'Your service referral for Esther Bello has been quoted — ₦4.2M.', time: '2 hours ago', unread: true },
    { id: 'm3', from: 'Chisom Obiora', preview: 'Thanks for the tour today, sending an offer soon.', time: 'Yesterday', unread: false },
  ];

  const REFERRAL_COMMISSION_RATE = 0.05; // 5% of completed service value

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'listings', label: 'My Listings', icon: Home },
    { id: 'leads', label: 'My Leads', icon: Users },
    { id: 'referrals', label: 'Service Referrals', icon: Gift },
    { id: 'commissions', label: 'Commissions', icon: DollarSign },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];
</script>

<div class="flex h-screen w-full bg-[#050A0E] text-stone-300 font-sans overflow-hidden">
  <!-- Sidebar (desktop) -->
  <aside class="w-64 flex-shrink-0 border-r border-white/5 bg-white/[0.02] flex flex-col hidden md:flex">
    <div class="p-6">
      <h1 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
          <span class="text-white font-bold">A</span>
        </div>
        Agent Portal
      </h1>

      <div class="mt-8 flex items-center gap-3 rounded-xl bg-white/5 p-3 border border-white/5">
        <img src="https://picsum.photos/seed/agent/100/100" alt="Agent" class="h-10 w-10 rounded-full object-cover" />
        <div>
          <p class="text-sm font-medium text-white">Adaeze Okonkwo</p>
          <p class="text-xs text-stone-400">ADK Premium Estates</p>
        </div>
      </div>
    </div>

    <nav class="flex-1 overflow-y-auto px-4 py-4 space-y-1 hide-scrollbar">
      {#each navItems as item}
        <button
          on:click={() => currentTab = item.id}
          class="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all {currentTab === item.id ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500' : 'text-stone-400 hover:bg-white/5 hover:text-white'}"
        >
          <svelte:component this={item.icon} class="h-5 w-5" />
          {item.label}
        </button>
      {/each}
    </nav>
  </aside>

  <!-- Mobile drawer -->
  {#if isMobileNavOpen}
    <div class="fixed inset-0 z-50 md:hidden">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" role="presentation" on:click={() => (isMobileNavOpen = false)}></div>
      <aside class="absolute inset-y-0 left-0 w-[85%] max-w-xs bg-[#0A0F14] border-r border-white/5 flex flex-col overflow-y-auto">
        <div class="flex items-center justify-between p-6 border-b border-white/5">
          <h1 class="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <span class="text-white font-bold">A</span>
            </div>
            Agent Portal
          </h1>
          <button class="flex items-center justify-center w-11 h-11 rounded-xl text-stone-400 active:bg-white/10" aria-label="Close menu" on:click={() => (isMobileNavOpen = false)}>
            <X class="w-5 h-5" />
          </button>
        </div>
        <nav class="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {#each navItems as item}
            <button
              on:click={() => { currentTab = item.id; isMobileNavOpen = false; }}
              class="w-full flex items-center gap-3 rounded-lg px-4 py-3 min-h-[44px] text-sm font-medium transition-all {currentTab === item.id ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500' : 'text-stone-400 hover:bg-white/5 hover:text-white'}"
            >
              <svelte:component this={item.icon} class="h-5 w-5" />
              {item.label}
            </button>
          {/each}
        </nav>
      </aside>
    </div>
  {/if}

  <main class="flex-1 flex flex-col h-screen overflow-hidden">
    <header class="h-20 flex-shrink-0 border-b border-white/5 bg-[#050A0E]/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 z-10 gap-2">
      <div class="flex items-center gap-2 min-w-0">
        <button class="md:hidden flex items-center justify-center w-11 h-11 -ml-2 flex-shrink-0 rounded-full text-stone-300 active:bg-white/10" aria-label="Open menu" on:click={() => (isMobileNavOpen = true)}>
          <Menu class="h-6 w-6" />
        </button>
        <h2 class="text-lg md:text-2xl font-semibold text-white capitalize truncate">{currentTab.replace('-', ' ')}</h2>
      </div>
      <button class="relative rounded-full p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:bg-white/10">
        <Bell class="h-5 w-5" />
      </button>
    </header>

    <div class="flex-1 overflow-y-auto p-8 hide-scrollbar">
      {#key currentTab}
      <div in:fly={{ y: 10, duration: 220, delay: 80 }}>
      {#if currentTab === 'overview'}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Active Listings" value="12" change="Stable" changeType="up" icon={Home} />
          <StatCard title="New Leads" value="23" change="+5 this month" changeType="up" icon={Users} iconBg="bg-blue-500/20" />
          <StatCard title="Viewings Scheduled" value="7" change="Next: Today 2PM" changeType="up" icon={Calendar} iconBg="bg-purple-500/20" />
          <StatCard title="Commission Earned" value="2.4" prefix="₦" suffix="M" change="+18%" changeType="up" icon={DollarSign} iconBg="bg-emerald-500/20" />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div class="lg:col-span-2">
             <RevenueChart data={COMMISSION_DATA} type="bar" />
          </div>
          
          <!-- Schedule mini-view -->
          <div class="rounded-xl border border-white/5 bg-white/[0.02] p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Today's Schedule</h3>
            <div class="space-y-4">
              {#each VIEWINGS as view}
                <div class="p-4 rounded-lg bg-white/5 border border-white/5">
                  <div class="flex justify-between items-start mb-2">
                    <span class="text-emerald-400 text-sm font-medium">{view.time}</span>
                    <span class="text-xs px-2 py-1 rounded bg-stone-800 text-stone-300">{view.status}</span>
                  </div>
                  <h4 class="text-white font-medium">{view.client}</h4>
                  <p class="text-sm text-stone-400">{view.property}</p>
                </div>
              {/each}
              <button class="w-full py-2 text-sm text-stone-400 hover:text-white border border-white/10 rounded-lg">View Full Calendar</button>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-semibold text-white mb-4">Recent Leads</h3>
          <LeadsTable leads={MOCK_LEADS.slice(0, 3)} />
        </div>
        
      {:else if currentTab === 'leads'}
        <div class="mb-6 flex justify-between">
          <h3 class="text-xl font-medium text-white">Lead Pipeline</h3>
          <button class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex gap-2"><Plus class="w-4 h-4"/> Add Lead</button>
        </div>
        <LeadsTable leads={MOCK_LEADS} />

      {:else if currentTab === 'listings'}
        <div class="mb-6 flex justify-between items-center">
          <h3 class="text-xl font-medium text-white">My Listings</h3>
          <button class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex gap-2"><Plus class="w-4 h-4"/> Add Listing</button>
        </div>
        <PropertyTable properties={MOCK_LISTINGS} />

      {:else if currentTab === 'referrals'}
        <div class="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h3 class="text-xl font-medium text-white">Service Referrals</h3>
            <p class="text-sm text-stone-400 mt-1">Refer closed-sale clients into ADK's interior design, renovation, smart-home and construction services — earn {(REFERRAL_COMMISSION_RATE * 100).toFixed(0)}% on every completed request.</p>
          </div>
          <a href="/services" class="flex-shrink-0 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Send class="w-4 h-4" /> New Referral
          </a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Active Referrals" value={MOCK_REFERRALS.filter(r => r.status !== 'COMPLETED').length} change="Across 4 clients" changeType="up" icon={Gift} iconBg="bg-purple-500/20" />
          <StatCard title="Referral Earnings" value={(MOCK_REFERRALS.reduce((s, r) => s + (r.status === 'COMPLETED' ? r.value * REFERRAL_COMMISSION_RATE : 0), 0) / 1000).toFixed(0)} prefix="₦" suffix="K" change="This quarter" changeType="up" icon={DollarSign} iconBg="bg-emerald-500/20" />
          <StatCard title="Pipeline Value" value={(MOCK_REFERRALS.reduce((s, r) => s + r.value, 0) / 1000000).toFixed(1)} prefix="₦" suffix="M" change="Quoted + in progress" changeType="up" icon={CheckCircle2} iconBg="bg-blue-500/20" />
        </div>

        <div class="rounded-xl border border-white/5 bg-[#050A0E]/80 shadow-xl overflow-hidden">
          <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-white/5 text-stone-400">
              <tr>
                <th class="px-6 py-4">Client</th>
                <th class="px-6 py-4">Service</th>
                <th class="px-6 py-4">Est. Value</th>
                <th class="px-6 py-4">Status</th>
                <th class="px-6 py-4">Referred</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              {#each MOCK_REFERRALS as r}
                <tr class="hover:bg-white/5">
                  <td class="px-6 py-4 text-white font-medium">{r.client}</td>
                  <td class="px-6 py-4">
                    <span class="text-stone-300">{r.service}</span>
                    <span class="block text-xs {SERVICE_CATEGORY_META[r.category]?.color ?? 'text-stone-500'}">{SERVICE_CATEGORY_META[r.category]?.label ?? r.category}</span>
                  </td>
                  <td class="px-6 py-4 text-stone-300">{r.value > 0 ? `₦${(r.value / 1000000).toFixed(1)}M` : '—'}</td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-full text-xs {REQUEST_STATUS_META[r.status]?.classes}">{REQUEST_STATUS_META[r.status]?.label ?? r.status}</span>
                  </td>
                  <td class="px-6 py-4 text-stone-500">{r.date}</td>
                </tr>
              {/each}
            </tbody>
          </table>
          </div>
        </div>

      {:else if currentTab === 'commissions'}
        <div class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard title="YTD Commission" value="10.9" prefix="₦" suffix="M" change="+22%" changeType="up" icon={DollarSign} iconBg="bg-emerald-500/20" />
            <StatCard title="This Month" value="1.8" prefix="₦" suffix="M" change="+18%" changeType="up" icon={DollarSign} />
            <StatCard title="Pending Payout" value="640" prefix="₦" suffix="K" change="Next payout Oct 1" changeType="up" icon={Clock} iconBg="bg-amber-500/20" />
          </div>
          <div class="p-6 rounded-xl border border-white/5 bg-white/[0.02]">
            <h3 class="text-lg font-semibold text-white mb-4">Commission History</h3>
            <RevenueChart data={COMMISSION_DATA} type="bar" />
          </div>
        </div>

      {:else if currentTab === 'schedule'}
        <div class="mb-6 flex justify-between items-center">
          <h3 class="text-xl font-medium text-white">Upcoming Viewings</h3>
          <button class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex gap-2 text-sm"><Plus class="w-4 h-4"/> Schedule Viewing</button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {#each VIEWINGS as view}
            <div class="p-4 rounded-lg bg-white/5 border border-white/5">
              <div class="flex justify-between items-start mb-2">
                <span class="text-emerald-400 text-sm font-medium">{view.time}</span>
                <span class="text-xs px-2 py-1 rounded bg-stone-800 text-stone-300">{view.status}</span>
              </div>
              <h4 class="text-white font-medium">{view.client}</h4>
              <p class="text-sm text-stone-400">{view.property}</p>
            </div>
          {/each}
        </div>

      {:else if currentTab === 'messages'}
        <div class="rounded-xl border border-white/5 bg-[#050A0E]/80 shadow-xl divide-y divide-white/5 overflow-hidden">
          {#each MOCK_MESSAGES as msg}
            <div class="flex items-start gap-4 p-5 hover:bg-white/5 transition-colors">
              <div class="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-emerald-900/40 text-emerald-300 font-semibold text-sm">
                {msg.from[0]}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <p class="text-white font-medium text-sm">{msg.from}</p>
                  <span class="text-xs text-stone-500">{msg.time}</span>
                </div>
                <p class="text-sm text-stone-400 truncate mt-0.5">{msg.preview}</p>
              </div>
              {#if msg.unread}
                <span class="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-2"></span>
              {/if}
            </div>
          {/each}
        </div>

      {:else}
        <div class="max-w-2xl">
          <div class="rounded-xl border border-white/5 bg-white/[0.02] p-6 space-y-6">
            <h3 class="text-lg font-medium text-white border-b border-white/10 pb-4">Profile Settings</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label for="agent-profile-name" class="text-sm text-stone-400">Full Name</label>
                <input id="agent-profile-name" type="text" value="Adaeze Okonkwo" class="w-full bg-[#050A0E] border border-white/10 rounded-lg p-2.5 text-white" />
              </div>
              <div class="space-y-2">
                <label for="agent-profile-email" class="text-sm text-stone-400">Email Address</label>
                <input id="agent-profile-email" type="email" value="adaeze@adkpremium.com" class="w-full bg-[#050A0E] border border-white/10 rounded-lg p-2.5 text-white" />
              </div>
            </div>
            <div class="pt-4">
              <button class="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium">Save Changes</button>
            </div>
          </div>
        </div>
      {/if}
      </div>
      {/key}
    </div>
  </main>
</div>
