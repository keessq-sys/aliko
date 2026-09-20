<script lang="ts">
  import { ArrowUpRight } from 'lucide-svelte';
  import { SIGNATURE_DEVELOPMENTS } from '$lib/data/imagery';
</script>

<section class="bg-[#050A0E] py-20 text-white">
  <div class="container mx-auto px-6">
    <div class="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p class="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Signature Developments</p>
        <h2 class="font-serif text-3xl font-bold sm:text-5xl">Landmarks Across Nigeria</h2>
        <p class="mt-3 max-w-xl text-stone-400">
          A portfolio of master-planned estates and verified developments &mdash; from luxury residential
          hills to waterfront towers, built and delivered end to end.
        </p>
      </div>
      <a href="/properties" class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10">
        Explore All Developments <ArrowUpRight size={16} />
      </a>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
      {#each SIGNATURE_DEVELOPMENTS as dev, i}
        <a
          href="/properties"
          class="group relative overflow-hidden rounded-2xl border border-white/5 {i === 0 || i === 3 ? 'lg:row-span-2' : ''}"
          style="min-height: {i === 0 || i === 3 ? '520px' : '250px'}"
        >
          <img
            src={dev.image}
            alt={dev.name}
            class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>
          <div class="absolute inset-x-0 bottom-0 p-5">
            <p class="text-xs font-medium uppercase tracking-wide text-emerald-300">{dev.location}</p>
            <h3 class="mt-1 font-serif text-lg font-bold text-white sm:text-xl">{dev.name}</h3>
          </div>
        </a>
      {/each}
    </div>
  </div>
</section>
