<script lang="ts">
  import { MapPin, Navigation } from 'lucide-svelte';
  import MasterPlanViewer from '$lib/components/three/MasterPlanViewer.svelte';
  import { useQuery } from '$lib/convex/queries';
  import { api } from '$lib/convex/_generated/api';

  const livePlots = useQuery(api.plots.listPlots, { limit: 100 });
  $: hotspots = ($livePlots ?? []).filter((plot) =>
    plot.positionX !== undefined && plot.positionY !== undefined && plot.positionZ !== undefined
  ).map((plot) => ({
    plotId: String(plot._id), beaconNumber: plot.beaconNumber, sizeSqm: plot.sizeSqm,
    status: plot.status, position: [plot.positionX!, plot.positionY!, plot.positionZ!] as [number, number, number]
  }));
  $: available = ($livePlots ?? []).filter((plot) => plot.status === 'AVAILABLE').length;
  $: reserved = ($livePlots ?? []).filter((plot) => plot.status === 'RESERVED').length;
</script>

<style>
  .glass-panel {
    background: rgba(5, 10, 14, 0.7);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
</style>

{#if hotspots.length}
<section class="relative w-full min-h-[640px] bg-[#050A0E] text-white overflow-hidden">
  <div class="container mx-auto px-6 py-16">
    <div class="mb-10 text-center max-w-2xl mx-auto">
      <div class="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
        <MapPin class="text-emerald-400" size={24} />
      </div>
      <h2 class="text-3xl md:text-4xl font-extrabold mb-3 leading-tight">Explore the Master Plan in 3D</h2>
      <p class="text-gray-400">Drag to orbit, hover a beacon to inspect it, and click through to any available plot &mdash; live, in three dimensions.</p>
    </div>

    <div class="flex flex-col lg:flex-row gap-6 items-stretch">
      <div class="relative w-full lg:w-8/12 h-[420px] lg:h-[520px] rounded-3xl overflow-hidden border border-white/10">
        <MasterPlanViewer {hotspots} />
      </div>

      <div class="w-full lg:w-4/12 glass-panel rounded-3xl p-8 flex flex-col justify-center">
        <h3 class="text-xl font-bold mb-4">Live Plot Availability</h3>
        <div class="space-y-4 mb-8">
          <div class="flex justify-between items-center border-b border-white/10 pb-2">
            <span class="font-medium text-gray-300">Available</span>
            <span class="text-emerald-400 font-bold">{available} plots</span>
          </div>
          <div class="flex justify-between items-center border-b border-white/10 pb-2">
            <span class="font-medium text-gray-300">Reserved</span>
            <span class="text-amber-400 font-bold">{reserved} plots</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-medium text-gray-300">Mapped in 3D</span>
            <span class="text-emerald-400 font-bold">{hotspots.length} plots</span>
          </div>
        </div>
        <a href="/map" class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
          <Navigation size={18} /> Open Full Map
        </a>
      </div>
    </div>
  </div>
</section>
{/if}
