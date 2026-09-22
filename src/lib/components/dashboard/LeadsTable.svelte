<script lang="ts">
  import { Phone, Mail, Eye, Search, Check, MoreVertical } from 'lucide-svelte';
  
  export let leads: any[] = [];
  
  let currentTab = 'all';
  const tabs = [
    { id: 'all', label: 'All Leads' },
    { id: 'new', label: 'New' },
    { id: 'contacted', label: 'Contacted' },
    { id: 'viewing', label: 'Viewing' },
    { id: 'negotiating', label: 'Negotiating' },
    { id: 'closed', label: 'Closed' }
  ];

  $: filteredLeads = currentTab === 'all' 
    ? leads 
    : leads.filter(l => l.status === currentTab);

  function getStatusColor(status: string) {
    switch(status) {
      case 'new': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'contacted': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'viewing': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'negotiating': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'closed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'lost': return 'bg-stone-500/20 text-stone-400 border-stone-500/30';
      default: return 'bg-stone-500/20 text-stone-400 border-stone-500/30';
    }
  }

  function formatCurrency(value: number) {
    return '₦' + value.toLocaleString();
  }
</script>

<div class="rounded-xl border border-white/5 bg-[#050A0E]/80 shadow-xl backdrop-blur-md overflow-hidden">
  <!-- Header & Filters -->
  <div class="border-b border-white/5 p-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h3 class="text-lg font-semibold text-white">Leads Management</h3>
      
      <div class="relative w-full sm:w-64">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input 
          type="text" 
          placeholder="Search leads..." 
          class="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-stone-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
        />
      </div>
    </div>

    <!-- Tabs -->
    <div class="mt-6 flex space-x-1 overflow-x-auto pb-1 hide-scrollbar">
      {#each tabs as tab}
        <button 
          on:click={() => currentTab = tab.id}
          class="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors {currentTab === tab.id ? 'bg-emerald-500/20 text-emerald-400' : 'text-stone-400 hover:bg-white/5 hover:text-white'}"
        >
          {tab.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- Table -->
  <div class="overflow-x-auto">
    {#if filteredLeads.length > 0}
      <div class="overflow-x-auto">
      <table class="w-full text-left text-sm text-stone-300">
        <thead class="bg-white/5 text-xs uppercase text-stone-400">
          <tr>
            <th class="px-6 py-4 font-medium">Lead</th>
            <th class="px-6 py-4 font-medium">Interest</th>
            <th class="px-6 py-4 font-medium">Source</th>
            <th class="px-6 py-4 font-medium">Date</th>
            <th class="px-6 py-4 font-medium">Status</th>
            <th class="px-6 py-4 font-medium">Value</th>
            <th class="px-6 py-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          {#each filteredLeads as lead}
            <tr class="hover:bg-white/[0.02] transition-colors group">
              <td class="px-6 py-4">
                <div class="font-medium text-white">{lead.name}</div>
                <div class="text-xs text-stone-500">{lead.email}</div>
              </td>
              <td class="px-6 py-4">{lead.propertyInterest}</td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-stone-300">
                  {lead.source}
                </span>
              </td>
              <td class="px-6 py-4 text-stone-400">{lead.date}</td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium {getStatusColor(lead.status)}">
                  {lead.status}
                </span>
              </td>
              <td class="px-6 py-4 font-medium text-stone-300">{formatCurrency(lead.value)}</td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button class="rounded min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:bg-emerald-500/20 hover:text-emerald-400" title="Call" aria-label="Call lead">
                    <Phone class="h-4 w-4" />
                  </button>
                  <button class="rounded min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:bg-blue-500/20 hover:text-blue-400" title="Email" aria-label="Email lead">
                    <Mail class="h-4 w-4" />
                  </button>
                  <button class="rounded min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:bg-white/10 hover:text-white" title="More" aria-label="More actions">
                    <MoreVertical class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      </div>
    {:else}
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <div class="mb-4 rounded-full bg-white/5 p-4">
          <Search class="h-8 w-8 text-stone-500" />
        </div>
        <h4 class="mb-1 text-lg font-medium text-white">No leads found</h4>
        <p class="text-sm text-stone-400">There are no leads matching your current filters.</p>
      </div>
    {/if}
  </div>
  
  <!-- Pagination (mock) -->
  <div class="border-t border-white/5 p-4 flex items-center justify-between text-sm text-stone-400">
    <span>Showing 1 to {filteredLeads.length} of {leads.length} entries</span>
    <div class="flex gap-1">
      <button class="rounded px-3 py-1 hover:bg-white/5" disabled>Prev</button>
      <button class="rounded bg-emerald-500/20 px-3 py-1 text-emerald-400">1</button>
      <button class="rounded px-3 py-1 hover:bg-white/5">Next</button>
    </div>
  </div>
</div>
