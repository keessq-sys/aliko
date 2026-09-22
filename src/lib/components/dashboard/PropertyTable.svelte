<script lang="ts">
  import { Edit, EyeOff, Trash2, Plus, Filter } from 'lucide-svelte';
  
  export let properties: any[] = [];
  
  function getStatusColor(status: string) {
    switch(status.toLowerCase()) {
      case 'available': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'reserved': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'sold': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'rented': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-stone-500/20 text-stone-400 border-stone-500/30';
    }
  }
</script>

<div class="rounded-xl border border-white/5 bg-[#050A0E]/80 shadow-xl backdrop-blur-md overflow-hidden">
  <!-- Header -->
  <div class="border-b border-white/5 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <h3 class="text-lg font-semibold text-white">Managed Properties</h3>
    
    <div class="flex items-center gap-3">
      <button class="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-stone-300 hover:bg-white/10 transition-colors">
        <Filter class="h-4 w-4" />
        Filter
      </button>
      <button class="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20">
        <Plus class="h-4 w-4" />
        Add Property
      </button>
    </div>
  </div>

  <!-- Table -->
  <div class="overflow-x-auto">
    <div class="overflow-x-auto">
    <table class="w-full text-left text-sm text-stone-300">
      <thead class="bg-white/5 text-xs uppercase text-stone-400">
        <tr>
          <th class="w-12 px-6 py-4">
            <input type="checkbox" class="rounded border-stone-600 bg-stone-800 text-emerald-500 focus:ring-emerald-500/50" />
          </th>
          <th class="px-6 py-4 font-medium">Property</th>
          <th class="px-6 py-4 font-medium">Type</th>
          <th class="px-6 py-4 font-medium">Location</th>
          <th class="px-6 py-4 font-medium">Status</th>
          <th class="px-6 py-4 font-medium">Price/Rent</th>
          <th class="px-6 py-4 font-medium">Agent</th>
          <th class="px-6 py-4 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5">
        {#each properties as property}
          <tr class="hover:bg-white/[0.02] transition-colors group">
            <td class="px-6 py-4">
              <input type="checkbox" class="rounded border-stone-600 bg-stone-800 text-emerald-500 focus:ring-emerald-500/50" />
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="h-10 w-10 overflow-hidden rounded-lg bg-stone-800">
                  <img src={property.image || 'https://picsum.photos/seed/prop1/100/100'} alt={property.title} class="h-full w-full object-cover" />
                </div>
                <div class="font-medium text-white">{property.title}</div>
              </div>
            </td>
            <td class="px-6 py-4">{property.type}</td>
            <td class="px-6 py-4 text-stone-400">{property.location}</td>
            <td class="px-6 py-4">
              <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium {getStatusColor(property.status)}">
                {property.status}
              </span>
            </td>
            <td class="px-6 py-4 font-medium text-white">₦{property.price.toLocaleString()}</td>
            <td class="px-6 py-4 text-stone-400">{property.agent}</td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button class="rounded min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:bg-white/10 hover:text-white" title="Edit" aria-label="Edit property">
                  <Edit class="h-4 w-4" />
                </button>
                <button class="rounded min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:bg-amber-500/20 hover:text-amber-400" title="Deactivate" aria-label="Deactivate property">
                  <EyeOff class="h-4 w-4" />
                </button>
                <button class="rounded min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:bg-rose-500/20 hover:text-rose-400" title="Delete" aria-label="Delete property">
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    </div>
  </div>
</div>
