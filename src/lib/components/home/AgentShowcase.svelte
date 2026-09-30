<script lang="ts">
  import { MapPin, CheckCircle2, ArrowRight } from 'lucide-svelte';
  import { reveal, revealStagger } from '$lib/actions/reveal';
  import { tilt } from '$lib/actions/tilt';
  import { useQuery } from '$lib/convex/queries';
  import { api } from '$lib/convex/_generated/api';

  const approvedAgents = useQuery(api.partners.listApprovedAgents, { limit: 4 });
  $: agents = $approvedAgents ?? [];
</script>

<style>
  .agent-card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s ease;
  }
  .agent-card:hover {
    border-color: rgba(217, 119, 6, 0.4);
    box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
  }
</style>

<section class="py-24 bg-[#050A0E] text-white" use:reveal>
  <div class="container mx-auto px-6">
    
    <div class="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
      <div>
        <h4 class="text-amber-500 font-bold tracking-widest uppercase text-sm mb-2">Verified Professionals</h4>
        <h2 class="text-3xl md:text-5xl font-extrabold">Meet Our Top Agents</h2>
      </div>
      <a href="/agents" class="flex items-center gap-2 text-amber-400 hover:text-amber-300 font-semibold group transition-colors">
        View All Agents 
        <ArrowRight size={18} class="group-hover:translate-x-1 transition-transform" />
      </a>
    </div>

    {#if agents.length}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" use:revealStagger={{ step: 90 }}>
      {#each agents as agent}
        <div class="agent-card rounded-2xl p-6 flex flex-col relative group" use:tilt={{ max: 6 }}>
          
          <!-- Verification Badge -->
          <div class="absolute top-4 right-4 bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 size={12} /> VERIFIED
          </div>

          <!-- Header -->
          <div class="flex items-center gap-4 mb-6">
            <div class="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-amber-500 transition-colors">
              <div class="flex h-full w-full items-center justify-center bg-emerald-950 text-xl font-bold text-emerald-300">{agent.fullName.slice(0, 1)}</div>
            </div>
            <div>
              <h3 class="text-lg font-bold">{agent.fullName}</h3>
              <p class="text-xs text-gray-400 flex items-center gap-1"><MapPin size={12}/> {agent.statesOfOperation?.[0] ?? 'Nigeria'}</p>
            </div>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-2 gap-4 mb-6 py-4 border-y border-white/5">
            <div>
              <p class="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Experience</p>
              <p class="font-bold text-amber-400">{agent.experience || 'Verified'}</p>
            </div>
            <div>
              <p class="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Agency</p>
              <p class="truncate text-sm font-bold">{agent.agencyName || 'Independent'}</p>
            </div>
          </div>

          <!-- Specs -->
          <div class="flex gap-2 mb-6 flex-wrap">
            {#each agent.specializations as spec}
              <span class="text-xs px-2 py-1 rounded-md bg-white/5 text-gray-300 border border-white/10">
                {spec}
              </span>
            {/each}
          </div>

          <!-- CTA -->
          <button class="mt-auto w-full py-3 rounded-xl border border-white/10 font-semibold text-sm hover:bg-white/5 transition-colors">
            Contact Agent
          </button>
          
        </div>
      {/each}
    </div>
    {/if}

  </div>
</section>
