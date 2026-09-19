<script lang="ts">
  import { ArrowRight } from 'lucide-svelte';

  const types = [
    { name: 'Residential', desc: 'Houses, Villas & Estates', count: 542, emoji: '🏠', color: 'emerald' },
    { name: 'Commercial', desc: 'Offices & Business Spaces', count: 124, emoji: '🏢', color: 'blue' },
    { name: 'Land & Plots', desc: 'Prime Development Land', count: 389, emoji: '🌿', color: 'amber' },
    { name: 'Apartments', desc: 'Modern City Living', count: 215, emoji: '🏙️', color: 'purple' },
    { name: 'Duplexes', desc: 'Twin & Semi-detached', count: 187, emoji: '🏰', color: 'rose' },
    { name: 'Penthouses', desc: 'Luxury Sky Residences', count: 42, emoji: '👑', color: 'cyan' }
  ];
</script>

<style>
  .type-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
  }
  
  .type-card:hover {
    transform: scale(1.02);
  }
</style>

<section class="py-24 bg-[#050A0E] text-white">
  <div class="container mx-auto px-6">
    
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-extrabold mb-4">Browse by Property Type</h2>
      <p class="text-gray-400">Explore our diverse portfolio of properties tailored to your specific needs.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each types as type}
        <a href={`/properties?type=${type.name}`} class={`type-card rounded-2xl p-6 group flex items-center justify-between hover:border-${type.color}-500/50 hover:shadow-[0_0_30px_rgba(var(--tw-colors-${type.color}-500),0.1)]`}>
          <div class="flex items-center gap-6">
            <div class={`w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}>
              {type.emoji}
            </div>
            <div>
              <h3 class="text-xl font-bold mb-1">{type.name}</h3>
              <p class="text-xs text-gray-400 mb-2">{type.desc}</p>
              <span class="text-xs font-semibold px-2 py-1 rounded-md bg-white/10 text-gray-300">
                {type.count} Listings
              </span>
            </div>
          </div>
          <div class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:bg-white/10 group-hover:text-white transition-all">
            <ArrowRight size={18} />
          </div>
        </a>
      {/each}
    </div>

  </div>
</section
