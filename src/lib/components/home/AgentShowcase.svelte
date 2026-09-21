<script lang="ts">
  import { Star, MapPin, CheckCircle2, ArrowRight } from 'lucide-svelte';
  import { reveal, revealStagger } from '$lib/actions/reveal';
  import { tilt } from '$lib/actions/tilt';

  const agents = [
    {
      name: "Adaeze Okonkwo", agency: "Diamond Key Luxe", location: "Lagos",
      rating: 4.9, active: 32, sales: "₦2.4B", clients: 127,
      specs: ["Luxury", "Commercial"], image: "https://picsum.photos/seed/agent1/200/200"
    },
    {
      name: "Emeka Chukwu", agency: "FCT Prime Estates", location: "Abuja",
      rating: 5.0, active: 45, sales: "₦4.1B", clients: 204,
      specs: ["Land", "Estates"], image: "https://picsum.photos/seed/agent2/200/200"
    },
    {
      name: "Fatima Musa", agency: "Northern Heights", location: "Kano",
      rating: 4.8, active: 18, sales: "₦850M", clients: 92,
      specs: ["Residential", "Rentals"], image: "https://picsum.photos/seed/agent3/200/200"
    },
    {
      name: "Chidi Nwosu", agency: "Riverside Realty", location: "Port Harcourt",
      rating: 4.7, active: 24, sales: "₦1.2B", clients: 115,
      specs: ["Industrial", "Land"], image: "https://picsum.photos/seed/agent4/200/200"
    }
  ];
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
              <img src={agent.image} alt={agent.name} class="w-full h-full object-cover" />
            </div>
            <div>
              <h3 class="text-lg font-bold">{agent.name}</h3>
              <p class="text-xs text-gray-400 flex items-center gap-1"><MapPin size={12}/> {agent.location}</p>
            </div>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-2 gap-4 mb-6 py-4 border-y border-white/5">
            <div>
              <p class="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Sales Volume</p>
              <p class="font-bold text-amber-400">{agent.sales}</p>
            </div>
            <div>
              <p class="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Rating</p>
              <p class="font-bold flex items-center gap-1">
                <Star size={14} class="text-amber-400 fill-amber-400" /> {agent.rating}
              </p>
            </div>
          </div>

          <!-- Specs -->
          <div class="flex gap-2 mb-6 flex-wrap">
            {#each agent.specs as spec}
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

  </div>
</section>
