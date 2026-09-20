<script lang="ts">
  import { 
    LayoutDashboard, Home, Users, Briefcase, DollarSign, 
    FileText, BarChart2, Settings, LogOut, Bell, ChevronDown, 
    Search, Plus, Filter, Download, AlertTriangle
  } from 'lucide-svelte';
  
  import StatCard from '$lib/components/dashboard/StatCard.svelte';
  import ActivityFeed from '$lib/components/dashboard/ActivityFeed.svelte';
  import PropertyTable from '$lib/components/dashboard/PropertyTable.svelte';
  import RevenueChart from '$lib/components/dashboard/RevenueChart.svelte';
  import AgentCard from '$lib/components/agent/AgentCard.svelte';
  
  let currentTab = 'overview';
  
  const MOCK_AGENTS = [
    { id: 'a1', name: 'Adaeze Okonkwo', photo: 'https://picsum.photos/seed/agent1/100/100', agency: 'ADK Premium Estates', listings: 32, revenue: 2_400_000_000, rating: 4.9, status: 'active', joinDate: '2022-03-15', clients: 127 },
    { id: 'a2', name: 'Emeka Chukwu', photo: 'https://picsum.photos/seed/agent2/100/100', agency: 'Chukwu Properties', listings: 18, revenue: 980_000_000, rating: 4.7, status: 'active', joinDate: '2023-01-20', clients: 63 },
    { id: 'a3', name: 'Fatima Musa', photo: 'https://picsum.photos/seed/agent3/100/100', agency: 'Musa Real Estate', listings: 24, revenue: 1_650_000_000, rating: 5.0, status: 'active', joinDate: '2021-07-08', clients: 91 },
    { id: 'a4', name: 'Chidi Nwosu', photo: 'https://picsum.photos/seed/agent4/100/100', agency: 'Independent', listings: 9, revenue: 420_000_000, rating: 4.5, status: 'pending', joinDate: '2024-02-01', clients: 28 },
  ];

  const REVENUE_DATA = [
    { month: 'Jan', revenue: 8_400_000, expenses: 2_100_000 },
    { month: 'Feb', revenue: 9_200_000, expenses: 2_400_000 },
    { month: 'Mar', revenue: 11_800_000, expenses: 2_800_000 },
    { month: 'Apr', revenue: 10_500_000, expenses: 2_200_000 },
    { month: 'May', revenue: 13_200_000, expenses: 3_100_000 },
    { month: 'Jun', revenue: 12_700_000, expenses: 2_900_000 },
    { month: 'Jul', revenue: 15_400_000, expenses: 3_500_000 },
    { month: 'Aug', revenue: 14_800_000, expenses: 3_200_000 },
    { month: 'Sep', revenue: 16_100_000, expenses: 3_800_000 },
    { month: 'Oct', revenue: 17_500_000, expenses: 4_100_000 },
    { month: 'Nov', revenue: 16_800_000, expenses: 3_900_000 },
    { month: 'Dec', revenue: 19_200_000, expenses: 4_500_000 },
  ];

  const MOCK_PROPERTIES = [
    { id: 'p1', title: 'Maitama Luxury Villa', type: 'Residential', location: 'Maitama, Abuja', status: 'Available', price: 850000000, agent: 'Adaeze Okonkwo' },
    { id: 'p2', title: 'Victoria Island Office Space', type: 'Commercial', location: 'VI, Lagos', status: 'Rented', price: 15000000, agent: 'Emeka Chukwu' },
    { id: 'p3', title: 'Lekki Phase 1 Duplex', type: 'Residential', location: 'Lekki, Lagos', status: 'Sold', price: 320000000, agent: 'Fatima Musa' },
    { id: 'p4', title: 'Asokoro Penthouse', type: 'Residential', location: 'Asokoro, Abuja', status: 'Available', price: 550000000, agent: 'Adaeze Okonkwo' },
  ];

  const MOCK_ACTIVITIES = [
    { id: '1', user: 'Adaeze Okonkwo', description: 'listed a new property: Asokoro Penthouse', timestamp: '2 hours ago', color: '#059669', icon: Home },
    { id: '2', user: 'System', description: 'processed rent payment for VI Office Space', timestamp: '5 hours ago', color: '#3b82f6', icon: DollarSign },
    { id: '3', user: 'Fatima Musa', description: 'closed sale for Lekki Phase 1 Duplex', timestamp: 'Yesterday', color: '#f59e0b', icon: Briefcase },
  ];
  
  const MOCK_TENANTS = [
    { name: 'Oluwaseun Adeyemi', email: 'olu@example.com', phone: '+2348012345678', property: 'VI Office Space', status: 'Active', rent: '₦15,000,000/yr', end: 'Oct 2025' }
  ];

  const MOCK_DOCS = [
    { name: 'Maitama_C_of_O.pdf', type: 'PDF', property: 'Maitama Luxury Villa', date: '2024-09-10', size: '2.4 MB' },
    { name: 'Lekki_Deed_of_Assignment.pdf', type: 'PDF', property: 'Lekki Phase 1 Duplex', date: '2024-09-15', size: '1.1 MB' },
  ];

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'properties', label: 'My Properties', icon: Home },
    { id: 'tenants', label: 'Tenants', icon: Users },
    { id: 'agents', label: 'My Agents', icon: Briefcase },
    { id: 'financials', label: 'Financials', icon: DollarSign },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
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
        ADK Manager
      </h1>
      
      <div class="mt-8 flex items-center gap-3 rounded-xl bg-white/5 p-3 border border-white/5">
        <img src="https://picsum.photos/seed/manager/100/100" alt="Manager" class="h-10 w-10 rounded-full object-cover" />
        <div>
          <p class="text-sm font-medium text-white">Chief Manager</p>
          <p class="text-xs text-emerald-500">Premium Plan</p>
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
    
    <div class="p-4 border-t border-white/5">
      <button class="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors">
        <LogOut class="h-5 w-5" />
        Sign Out
      </button>
    </div>
  </aside>

  <!-- Main Content -->
  <main class="flex-1 flex flex-col h-screen overflow-hidden">
    <!-- Header -->
    <header class="h-20 flex-shrink-0 border-b border-white/5 bg-[#050A0E]/80 backdrop-blur-md flex items-center justify-between px-8 z-10">
      <h2 class="text-2xl font-semibold text-white capitalize">{currentTab.replace('-', ' ')}</h2>
      
      <div class="flex items-center gap-6">
        <div class="relative hidden sm:block">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input type="text" placeholder="Search..." class="w-64 rounded-full border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
        </div>
        
        <button class="relative rounded-full p-2 text-stone-400 hover:bg-white/10 transition-colors">
          <Bell class="h-5 w-5" />
          <span class="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#050A0E]"></span>
        </button>
      </div>
    </header>

    <!-- Scrollable Content Area -->
    <div class="flex-1 overflow-y-auto p-8 hide-scrollbar">
      
      {#if currentTab === 'overview'}
        <!-- KPI Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Properties" value="47" change="+3 this month" changeType="up" icon={Home} />
          <StatCard title="Occupancy Rate" value="89%" change="+2% vs last month" changeType="up" icon={Users} iconBg="bg-blue-500/20" />
          <StatCard title="Monthly Revenue" value="14.2" prefix="₦" suffix="M" change="+₦1.1M" changeType="up" icon={DollarSign} iconBg="bg-emerald-500/20" />
          <StatCard title="Pending Tasks" value="8" change="3 urgent" changeType="down" icon={AlertTriangle} iconBg="bg-amber-500/20" />
        </div>

        <!-- Chart Row -->
        <div class="mb-8">
          <RevenueChart data={REVENUE_DATA} type="area" />
        </div>
        
        <!-- Bottom Row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 rounded-xl border border-white/5 bg-white/[0.02] p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Top Performing Properties</h3>
            <div class="space-y-4">
              {#each MOCK_PROPERTIES.slice(0, 3) as prop}
                <div class="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-colors">
                  <div>
                    <h4 class="font-medium text-white">{prop.title}</h4>
                    <p class="text-sm text-stone-400">{prop.location}</p>
                  </div>
                  <div class="text-right">
                    <p class="font-medium text-emerald-400">₦{(prop.price/1000000).toFixed(1)}M</p>
                    <p class="text-xs text-stone-500">{prop.status}</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>
          
          <div class="lg:col-span-1">
            <ActivityFeed activities={MOCK_ACTIVITIES} />
          </div>
        </div>

      {:else if currentTab === 'properties'}
        <PropertyTable properties={MOCK_PROPERTIES} />
        
      {:else if currentTab === 'tenants'}
        <div class="rounded-xl border border-white/5 bg-[#050A0E]/80 shadow-xl overflow-hidden">
          <div class="p-6 border-b border-white/5 flex justify-between items-center">
            <h3 class="text-lg font-semibold text-white">Active Tenants</h3>
            <button class="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <Filter class="w-4 h-4" /> Filter
            </button>
          </div>
          <table class="w-full text-left text-sm">
            <thead class="bg-white/5 text-stone-400">
              <tr>
                <th class="px-6 py-4">Tenant</th>
                <th class="px-6 py-4">Property</th>
                <th class="px-6 py-4">Rent Amount</th>
                <th class="px-6 py-4">Lease End</th>
                <th class="px-6 py-4">Status</th>
                <th class="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              {#each MOCK_TENANTS as t}
                <tr class="hover:bg-white/5">
                  <td class="px-6 py-4">
                    <div class="text-white font-medium">{t.name}</div>
                    <div class="text-xs text-stone-500">{t.email}</div>
                  </td>
                  <td class="px-6 py-4 text-stone-300">{t.property}</td>
                  <td class="px-6 py-4 text-white">{t.rent}</td>
                  <td class="px-6 py-4 text-stone-400">{t.end}</td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {t.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button class="text-stone-400 hover:text-white px-3 py-1 rounded border border-white/10">View</button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        
      {:else if currentTab === 'agents'}
        <div class="mb-6 flex justify-between items-center">
          <h3 class="text-lg font-medium text-white">Agent Roster</h3>
          <button class="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-emerald-500">
            <Plus class="w-4 h-4" /> Invite Agent
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {#each MOCK_AGENTS as agent}
            <AgentCard {agent} />
          {/each}
        </div>
        
      {:else if currentTab === 'financials'}
        <div class="space-y-6">
          <div class="grid grid-cols-3 gap-6">
             <StatCard title="Total Revenue (YTD)" value="158.4" prefix="₦" suffix="M" change="+15%" changeType="up" icon={DollarSign} />
             <StatCard title="Total Expenses (YTD)" value="37.2" prefix="₦" suffix="M" change="+5%" changeType="down" icon={BarChart2} iconBg="bg-rose-500/20" />
             <StatCard title="Net Profit (YTD)" value="121.2" prefix="₦" suffix="M" change="+18%" changeType="up" icon={Briefcase} iconBg="bg-blue-500/20" />
          </div>
          <div class="p-6 rounded-xl border border-white/5 bg-white/[0.02]">
            <RevenueChart data={REVENUE_DATA} type="bar" />
          </div>
        </div>
        
      {:else if currentTab === 'documents'}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each MOCK_DOCS as doc}
            <div class="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5">
              <div class="flex items-center gap-4">
                <div class="p-3 bg-red-500/20 text-red-400 rounded-lg">
                  <FileText class="w-6 h-6" />
                </div>
                <div>
                  <h4 class="text-sm font-medium text-white">{doc.name}</h4>
                  <p class="text-xs text-stone-400">{doc.property} • {doc.size}</p>
                </div>
              </div>
              <button class="p-2 hover:bg-white/10 rounded-full text-stone-400">
                <Download class="w-4 h-4" />
              </button>
            </div>
          {/each}
        </div>
        
      {:else}
        <div class="max-w-2xl">
          <div class="rounded-xl border border-white/5 bg-white/[0.02] p-6 space-y-6">
            <h3 class="text-lg font-medium text-white border-b border-white/10 pb-4">Profile Settings</h3>
            
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm text-stone-400">Full Name</label>
                <input type="text" value="Chief Manager" class="w-full bg-[#050A0E] border border-white/10 rounded-lg p-2.5 text-white" />
              </div>
              <div class="space-y-2">
                <label class="text-sm text-stone-400">Email Address</label>
                <input type="email" value="manager@adk.com" class="w-full bg-[#050A0E] border border-white/10 rounded-lg p-2.5 text-white" />
              </div>
            </div>
            
            <div class="pt-4">
              <button class="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium">Save Changes</button>
            </div>
          </div>
        </div>
      {/if}
      
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
