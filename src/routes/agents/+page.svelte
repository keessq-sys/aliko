<script lang="ts">
  import { Search, MapPin, Verified, Filter, Phone, MessageCircle } from 'lucide-svelte';
  import { SERVICE_GALLERIES } from '$lib/data/imagery';
  import { useQuery } from '$lib/convex/queries';
  import { api } from '$lib/convex/_generated/api';
  import { whatsappHref } from '$lib/data/contact';
  import { FALLBACK_AGENTS } from '$lib/data/fallbackCatalog';

  const heroImage = SERVICE_GALLERIES['property-development'][1];

  const agents = useQuery(api.partners.listApprovedAgents, {});

  let searchQuery = '';
  let specializationFilter = 'All Specializations';
  let stateFilter = 'All Locations';

  $: visibleAgents = ($agents?.length ? $agents : FALLBACK_AGENTS) as any[];
  $: specializationOptions = ['All Specializations', ...new Set(visibleAgents.flatMap((a: any) => a.specializations))];
  $: stateOptions = ['All Locations', ...new Set(visibleAgents.flatMap((a: any) => a.statesOfOperation))];

  $: filteredAgents = visibleAgents.filter((a: any) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        a.fullName.toLowerCase().includes(q) ||
        (a.agencyName ?? '').toLowerCase().includes(q) ||
        a.statesOfOperation.some((s: string) => s.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (specializationFilter !== 'All Specializations' && !a.specializations.includes(specializationFilter)) return false;
    if (stateFilter !== 'All Locations' && !a.statesOfOperation.includes(stateFilter)) return false;
    return true;
  });

  function clearFilters() {
    searchQuery = '';
    specializationFilter = 'All Specializations';
    stateFilter = 'All Locations';
  }
</script>

<div class="min-h-screen bg-[#050A0E] text-white">
  <!-- CTA Banner -->
  <div class="bg-gradient-to-r from-amber-600 to-amber-800 px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between">
    <div class="text-sm font-medium mb-2 sm:mb-0">Are you a real estate professional? Reach more clients with ADK.</div>
    <a href="/register/agent" class="text-sm bg-black/30 hover:bg-black/50 text-white px-4 py-1.5 rounded-full transition-colors border border-white/20 whitespace-nowrap">
      Register as Agent &rarr;
    </a>
  </div>

  <div class="relative overflow-hidden">
    <img src={heroImage} alt="" class="absolute inset-0 h-full w-full object-cover opacity-20" loading="eager" />
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#050A0E]/40 via-[#050A0E]/90 to-[#050A0E]"></div>
    <div class="relative px-4 sm:px-6 lg:px-8 py-12 max-w-7xl mx-auto">
    <!-- Hero -->
    <div class="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <h1 class="text-4xl sm:text-5xl font-bold mb-4">Meet Our Verified Agents</h1>
        <p class="text-gray-400 text-lg max-w-2xl">Connect with top-rated real estate professionals across Nigeria. Every verified agent on our platform has undergone strict background and licensing checks.</p>
      </div>
      <div class="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
        <span class="text-2xl font-bold text-emerald-400">{$agents === undefined ? '—' : visibleAgents.length}</span>
        <span class="text-sm text-gray-400 leading-tight">Verified<br>Agents</span>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 mb-10 flex flex-col lg:flex-row gap-4">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" bind:value={searchQuery} placeholder="Search by name, agency, or location..." class="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
      </div>

      <div class="flex gap-4 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
        <select bind:value={specializationFilter} class="min-h-[44px] bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 min-w-[150px]">
          {#each specializationOptions as opt}
            <option value={opt}>{opt}</option>
          {/each}
        </select>

        <select bind:value={stateFilter} class="min-h-[44px] bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 min-w-[150px]">
          {#each stateOptions as opt}
            <option value={opt}>{opt}</option>
          {/each}
        </select>

        <button on:click={clearFilters} class="min-h-[44px] bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl px-4 py-3 text-white transition-colors flex items-center gap-2">
          <Filter class="w-4 h-4" /> Clear
        </button>
      </div>
    </div>

    <!-- Agent Grid -->
    {#if $agents === undefined}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {#each Array(4) as _}
          <div class="h-80 animate-pulse rounded-2xl bg-white/5"></div>
        {/each}
      </div>
    {:else if filteredAgents.length === 0}
      <div class="rounded-2xl border border-dashed border-white/10 py-20 text-center">
        <p class="text-sm text-stone-500">No agents match your search.</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {#each filteredAgents as agent (agent._id)}
          <div class="group backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-emerald-500/50 hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 relative flex flex-col h-full">
            <!-- Avatar -->
            <div class="relative w-24 h-24 mx-auto mb-4">
              <div class="flex h-full w-full items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500/10 text-2xl font-bold text-emerald-300">
                {agent.fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
              </div>
              <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg shadow-emerald-500/20">
                <Verified class="w-3 h-3" /> VERIFIED
              </div>
            </div>

            <!-- Info -->
            <div class="text-center mb-4 flex-1">
              <h3 class="font-bold text-lg text-white group-hover:text-emerald-400 transition-colors">{agent.fullName}</h3>
              <p class="text-sm text-stone-400 mb-2">{agent.agencyName ?? 'Independent Agent'}</p>

              {#if agent.experience}
                <p class="mb-3 text-xs text-stone-500">{agent.experience} experience</p>
              {/if}

              <div class="flex flex-wrap justify-center gap-1.5 mb-3">
                {#each agent.specializations as spec}
                  <span class="text-[10px] bg-white/10 text-gray-300 px-2 py-1 rounded-md">{spec}</span>
                {/each}
              </div>

              <div class="flex items-center justify-center gap-1 text-xs text-gray-400">
                <MapPin class="w-3 h-3" /> {agent.statesOfOperation.join(', ') || 'Nigeria'}
              </div>
            </div>

            <!-- Actions -->
            <div class="grid grid-cols-2 gap-2 mt-auto">
              <a
                href={`tel:${agent.phone}`}
                class="flex min-h-[44px] items-center justify-center gap-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white transition-colors"
              >
                <Phone class="w-3 h-3" /> Call
              </a>
              <a
                href={whatsappHref(`Hi ${agent.fullName}, I found your profile on Aliko Diamond Key and would like to talk about a property.`, agent.phone)}
                target="_blank"
                rel="noopener noreferrer"
                class="flex min-h-[44px] items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs text-white transition-colors"
              >
                <MessageCircle class="w-3 h-3" /> WhatsApp
              </a>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
  </div>
</div>
