<script lang="ts">
  import { 
    LayoutDashboard, Home, Users, DollarSign, Calendar, 
    MessageSquare, Settings, LogOut, Bell, Plus, Phone, Mail
  } from 'lucide-svelte';
  
  import StatCard from '$lib/components/dashboard/StatCard.svelte';
  import RevenueChart from '$lib/components/dashboard/RevenueChart.svelte';
  import LeadsTable from '$lib/components/dashboard/LeadsTable.svelte';

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
    { client: 'Amara Eze', property: 'Maitama Duplex', time: '10:00 AM', status: 'Confirmed' },
    { client: 'Chisom Obiora', property: 'Lekki Land Plot', time: '2:30 PM', status: 'Pending' }
  ];

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'listings', label: 'My Listings', icon: Home },
    { id: 'leads', label: 'My Leads', icon: Users },
    { id: 'commissions', label: 'Commissions', icon: DollarSign },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];
</script>

<div class="flex h-screen w-full bg-[#050A0E] text-stone-300 font-sans overflow-hidden">
  <!-- Sidebar -->
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

  <main class="flex-1 flex flex-col h-screen overflow-hidden">
    <header class="h-20 flex-shrink-0 border-b border-white/5 bg-[#050A0E]/80 backdrop-blur-md flex items-center justify-between px-8 z-10">
      <h2 class="text-2xl font-semibold text-white capitalize">{currentTab.replace('-', ' ')}</h2>
      <button class="relative rounded-full p-2 text-stone-400 hover:bg-white/10">
        <Bell class="h-5 w-5" />
      </button>
    </header>

    <div class="flex-1 overflow-y-auto p-8 hide-scrollbar">
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
        
      {:else}
        <div class="flex flex-col items-center justify-center h-full text-stone-500">
           <LayoutDashboard class="w-16 h-16 mb-4 opacity-20" />
           <p>This module is under development.</p>
        </div>
      {/if}
    </div>
  </main>
</div>
