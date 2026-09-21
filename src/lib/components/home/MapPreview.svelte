<script lang="ts">
  import { MapPin, Navigation } from 'lucide-svelte';
  import MasterPlanViewer from '$lib/components/three/MasterPlanViewer.svelte';

  // Representative plot layout for the homepage teaser — the real 3D
  // master-plan view (interactive: drag to orbit, hover/click a beacon)
  // renders live per-project data once plots are loaded from Convex.
  const HOTSPOTS = [
    { plotId: 'demo-1', beaconNumber: 'A-101', sizeSqm: 650, status: 'AVAILABLE', position: [-4.5, 0, -4.5] as [number, number, number] },
    { plotId: 'demo-2', beaconNumber: 'A-102', sizeSqm: 650, status: 'AVAILABLE', position: [-2, 0, -4.5] as [number, number, number] },
    { plotId: 'demo-3', beaconNumber: 'A-103', sizeSqm: 720, status: 'RESERVED', position: [0.5, 0, -4.5] as [number, number, number] },
    { plotId: 'demo-4', beaconNumber: 'A-104', sizeSqm: 650, status: 'SOLD', position: [3, 0, -4.5] as [number, number, number] },
    { plotId: 'demo-5', beaconNumber: 'B-201', sizeSqm: 800, status: 'AVAILABLE', position: [-4.5, 0, -1.5] as [number, number, number] },
    { plotId: 'demo-6', beaconNumber: 'B-202', sizeSqm: 800, status: 'AVAILABLE', position: [-2, 0, -1.5] as [number, number, number] },
    { plotId: 'demo-7', beaconNumber: 'B-203', sizeSqm: 650, status: 'UNDER_DEVELOPMENT', position: [0.5, 0, -1.5] as [number, number, number] },
    { plotId: 'demo-8', beaconNumber: 'B-204', sizeSqm: 650, status: 'AVAILABLE', position: [3, 0, -1.5] as [number, number, number] },
    { plotId: 'demo-9', beaconNumber: 'C-301', sizeSqm: 900, status: 'RESERVED', position: [-4.5, 0, 1.5] as [number, number, number] },
    { plotId: 'demo-10', beaconNumber: 'C-302', sizeSqm: 650, status: 'AVAILABLE', position: [-2, 0, 1.5] as [number, number, number] },
    { plotId: 'demo-11', beaconNumber: 'C-303', sizeSqm: 650, status: 'AVAILABLE', position: [0.5, 0, 1.5] as [number, number, number] },
    { plotId: 'demo-12', beaconNumber: 'C-304', sizeSqm: 720, status: 'SOLD', position: [3, 0, 1.5] as [number, number, number] },
    { plotId: 'demo-13', beaconNumber: 'D-401', sizeSqm: 650, status: 'AVAILABLE', position: [-4.5, 0, 4.5] as [number, number, number] },
    { plotId: 'demo-14', beaconNumber: 'D-402', sizeSqm: 650, status: 'OFF_PLAN', position: [-2, 0, 4.5] as [number, number, number] },
    { plotId: 'demo-15', beaconNumber: 'D-403', sizeSqm: 800, status: 'AVAILABLE', position: [0.5, 0, 4.5] as [number, number, number] },
    { plotId: 'demo-16', beaconNumber: 'D-404', sizeSqm: 650, status: 'AVAILABLE', position: [3, 0, 4.5] as [number, number, number] }
  ];
</script>

<style>
  .glass-panel {
    background: rgba(5, 10, 14, 0.7);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
</style>

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
        <MasterPlanViewer hotspots={HOTSPOTS} />
      </div>

      <div class="w-full lg:w-4/12 glass-panel rounded-3xl p-8 flex flex-col justify-center">
        <h3 class="text-xl font-bold mb-4">Nationwide Coverage</h3>
        <div class="space-y-4 mb-8">
          <div class="flex justify-between items-center border-b border-white/10 pb-2">
            <span class="font-medium text-gray-300">Lagos State</span>
            <span class="text-emerald-400 font-bold">847 Listings</span>
          </div>
          <div class="flex justify-between items-center border-b border-white/10 pb-2">
            <span class="font-medium text-gray-300">Abuja, FCT</span>
            <span class="text-emerald-400 font-bold">456 Listings</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-medium text-gray-300">Port Harcourt</span>
            <span class="text-emerald-400 font-bold">234 Listings</span>
          </div>
        </div>
        <a href="/map" class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
          <Navigation size={18} /> Open Full Map
        </a>
      </div>
    </div>
  </div>
</section>
