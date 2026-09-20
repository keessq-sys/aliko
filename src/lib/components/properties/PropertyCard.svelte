<script lang="ts">
  import { MapPin, Bed, Bath, Square, Heart, ShieldCheck } from 'lucide-svelte';
  
  export let property: any;

  let isSaved = false;

  const toggleSave = (e: Event) => {
    e.preventDefault();
    isSaved = !isSaved;
  };
</script>

<a href="/properties/{property.id}" class="group relative flex flex-col bg-[#0A1118]/80 backdrop-blur-md rounded-2xl border border-emerald-900/30 overflow-hidden hover:shadow-[0_0_20px_rgba(5,150,105,0.2)] hover:-translate-y-1 transition-all duration-300 ease-out preserve-3d">
  <!-- Image container -->
  <div class="relative aspect-[3/2] overflow-hidden">
    <img 
      src={property.images[0]} 
      alt={property.title} 
      class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
    />
    <div class="absolute inset-0 bg-gradient-to-t from-[#050A0E] via-transparent to-transparent"></div>
    
    <!-- Top left badge -->
    <div class="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-xs font-medium text-white capitalize">
      {property.type}
    </div>

    <!-- Top right actions -->
    <div class="absolute top-3 right-3 flex items-center gap-2">
      {#if property.isVerified}
        <div class="p-1.5 rounded-full bg-emerald-500/20 backdrop-blur-sm text-emerald-400" title="Verified">
          <ShieldCheck size={16} />
        </div>
      {/if}
      <button 
        on:click={toggleSave}
        class="p-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 hover:bg-emerald-500/20 transition-colors"
      >
        <Heart size={16} class={isSaved ? "fill-rose-500 text-rose-500" : "text-white"} />
      </button>
    </div>

    <!-- Status badge -->
    <div class="absolute bottom-3 left-3">
      <span class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
        {property.status === 'available' ? 'bg-emerald-500 text-black' : 
         property.status === 'reserved' ? 'bg-amber-500 text-black' : 
         'bg-rose-500 text-white'}">
        {property.status}
      </span>
    </div>
  </div>

  <!-- Content -->
  <div class="p-4 flex flex-col flex-grow">
    <div class="flex items-start justify-between mb-2 gap-2">
      <h3 class="text-lg font-semibold text-white leading-tight line-clamp-2 group-hover:text-emerald-400 transition-colors">
        {property.title}
      </h3>
    </div>
    
    <div class="flex items-center text-emerald-200/60 text-sm mb-4">
      <MapPin size={14} class="mr-1 flex-shrink-0" />
      <span class="truncate">{property.location.address}, {property.location.state}</span>
    </div>

    <div class="flex items-center gap-4 text-emerald-100/70 text-sm mb-4">
      <div class="flex items-center gap-1.5" title="Bedrooms">
        <Bed size={16} /> <span>{property.bedrooms || '-'}</span>
      </div>
      <div class="flex items-center gap-1.5" title="Bathrooms">
        <Bath size={16} /> <span>{property.bathrooms || '-'}</span>
      </div>
      <div class="flex items-center gap-1.5" title="Size (sqm)">
        <Square size={16} /> <span>{property.sizeSqm || '-'}</span>
      </div>
    </div>

    <div class="mt-auto pt-4 border-t border-white/5 flex items-end justify-between">
      <div>
        <div class="text-2xl font-bold bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">
          ₦{Number(property.price ?? 0).toLocaleString()}
        </div>
        <div class="text-xs text-stone-400">
          {property.pricePerSqm ? `₦${Number(property.pricePerSqm).toLocaleString()} / sqm` : 'Price on request'}
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <img src={property.agent?.avatar} alt={property.agent?.name ?? 'ADK Agent'} class="w-8 h-8 rounded-full border border-white/10" />
      </div>
    </div>
  </div>
</a>

<style>
  .preserve-3d {
    transform-style: preserve-3d;
  }
</style>
