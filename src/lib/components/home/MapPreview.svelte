<script lang="ts">
  import { MapPin, Navigation } from 'lucide-svelte';
</script>

<style>
  .map-container {
    background-image: url('https://picsum.photos/seed/nigeriamap/1920/1080');
    background-size: cover;
    background-position: center;
    position: relative;
  }
  
  .map-overlay {
    background: linear-gradient(90deg, #050A0E 0%, rgba(5,10,14,0.9) 30%, transparent 100%);
  }
  
  @media (max-width: 768px) {
    .map-overlay {
      background: linear-gradient(0deg, #050A0E 0%, rgba(5,10,14,0.9) 50%, transparent 100%);
    }
  }

  .glass-panel {
    background: rgba(5, 10, 14, 0.7);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .pin {
    position: absolute;
    width: 20px;
    height: 20px;
    background: #059669;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 0 15px rgba(5,150,105,0.8);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(5,150,105, 0.7); }
    70% { box-shadow: 0 0 0 15px rgba(5,150,105, 0); }
    100% { box-shadow: 0 0 0 0 rgba(5,150,105, 0); }
  }
</style>

<section class="h-[60vh] min-h-[500px] w-full map-container text-white overflow-hidden flex items-center relative">
  <!-- Fake Pins for placeholder visual -->
  <div class="pin" style="top: 40%; left: 60%;"></div>
  <div class="pin bg-amber-500" style="top: 60%; left: 45%;"></div>
  <div class="pin" style="top: 75%; left: 55%;"></div>
  
  <div class="absolute inset-0 map-overlay z-0"></div>
  
  <div class="container mx-auto px-6 relative z-10 h-full flex flex-col justify-end md:justify-center">
    <div class="w-full md:w-5/12 glass-panel rounded-3xl p-8 mb-8 md:mb-0">
      
      <div class="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
        <MapPin class="text-emerald-400" size={24} />
      </div>
      
      <h2 class="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">Explore Properties <br/>on the Map</h2>
      <p class="text-gray-400 mb-8">Draw custom boundaries, filter by neighborhood, and see exact locations of verified properties across Nigeria.</p>
      
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
      
      <button class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
        <Navigation size={18} /> Open Full Map
      </button>
      
    </div>
  </div>
</section
