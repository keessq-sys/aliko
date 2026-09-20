<script lang="ts">
  import { MapPin } from 'lucide-svelte';
  import { EXPLORE_LOCATIONS } from '$lib/data/imagery';
</script>

<section class="bg-[#050A0E] py-20 text-white">
  <div class="container mx-auto px-6">
    <div class="mb-10 text-center">
      <p class="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Nationwide Coverage</p>
      <h2 class="font-serif text-3xl font-bold sm:text-5xl">Explore Nigeria, City by City</h2>
      <p class="mx-auto mt-3 max-w-xl text-stone-400">
        Verified properties, land and service partners in every major market &mdash; from Lagos's
        waterfront to Abuja's diplomatic districts.
      </p>
    </div>

    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {#each EXPLORE_LOCATIONS as loc}
        <a
          href="/properties?q={encodeURIComponent(loc.city)}"
          class="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/5"
        >
          <img
            src={loc.image}
            alt={loc.city}
            class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
          <div class="absolute inset-x-0 bottom-0 p-4">
            <p class="flex items-center gap-1 text-[11px] text-emerald-300">
              <MapPin size={11} /> {loc.listings}+ listings
            </p>
            <h3 class="font-serif text-lg font-bold text-white">{loc.city}</h3>
          </div>
        </a>
      {/each}
    </div>
  </div>
</section>
