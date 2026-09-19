<script lang="ts">
  import { Star, CheckCircle, MoreVertical } from 'lucide-svelte';

  export let agent: any;

  function getStatusColor(status: string) {
    switch(status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'inactive': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-stone-500/20 text-stone-400 border-stone-500/30';
    }
  }
</script>

<div class="group relative overflow-hidden rounded-xl border border-white/5 bg-[#050A0E]/80 p-6 shadow-xl backdrop-blur-md transition-all hover:-translate-y-1 hover:border-emerald-500/30">
  <button class="absolute right-4 top-4 text-stone-500 hover:text-white transition-colors">
    <MoreVertical class="h-5 w-5" />
  </button>

  <!-- Profile -->
  <div class="flex items-start gap-4">
    <div class="relative h-16 w-16 flex-shrink-0">
      <img src={agent.photo} alt={agent.name} class="h-full w-full rounded-full object-cover ring-2 ring-white/10" />
      <div class="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-1 ring-2 ring-[#050A0E]">
        <CheckCircle class="h-3 w-3 text-[#050A0E]" />
      </div>
    </div>
    
    <div>
      <h4 class="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{agent.name}</h4>
      <p class="text-sm text-stone-400">{agent.agency}</p>
      
      <div class="mt-2 flex items-center gap-2">
        <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider {getStatusColor(agent.status)}">
          {agent.status}
        </span>
        <div class="flex items-center gap-1 text-sm font-medium text-amber-400">
          <Star class="h-3 w-3 fill-amber-400" />
          {agent.rating.toFixed(1)}
        </div>
      </div>
    </div>
  </div>

  <!-- Stats Grid -->
  <div class="mt-6 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
    <div>
      <p class="text-xs text-stone-500">Listings</p>
      <p class="mt-1 text-lg font-semibold text-white">{agent.listings}</p>
    </div>
    <div>
      <p class="text-xs text-stone-500">Clients</p>
      <p class="mt-1 text-lg font-semibold text-white">{agent.clients}</p>
    </div>
    <div>
      <p class="text-xs text-stone-500">Revenue</p>
      <p class="mt-1 text-sm font-semibold text-white">₦{(agent.revenue / 1000000).toFixed(1)}M</p>
    </div>
  </div>

  <!-- Performance Bar -->
  <div class="mt-6">
    <div class="flex justify-between text-xs mb-1.5">
      <span class="text-stone-400">Monthly Target</span>
      <span class="text-emerald-400 font-medium">{(agent.listings / 50 * 100).toFixed(0)}%</span>
    </div>
    <div class="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div 
        class="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000"
        style="width: {Math.min(100, agent.listings / 50 * 100)}%"
      ></div>
    </div>
  </div>

  <!-- Actions -->
  <div class="mt-6 flex gap-2">
    <button class="flex-1 rounded-lg border border-emerald-500/50 bg-emerald-500/10 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors">
      View Profile
    </button>
    <button class="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-sm font-medium text-stone-300 hover:bg-white/10 transition-colors">
      Message
    </button>
  </div>
</div>
