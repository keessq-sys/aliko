<script lang="ts">
  import { MapPin, Bed, Bath, Square, Heart, ShieldCheck, Phone } from 'lucide-svelte';
  
  export let property: any;

  let isSaved = false;

  const toggleSave = (e: Event) => {
    e.preventDefault();
    isSaved = !isSaved;
  };
</script>

<div class="group flex flex-col md:flex-row bg-[#0A1118]/80 backdrop-blur-md rounded-2xl border border-emerald-900/30 overflow-hidden hover:shadow-[0_0_20px_rgba(5,150,105,0.2)] hover:border-l-emerald-500 transition-all duration-300">
  <!-- Image -->
  <a href="/properties/{property.id}" class="relative w-full md:w-[240px] h-48 md:h-auto flex-shrink-0 overflow-hidden">
    <img 
      src={property.images[0]} 
      alt={property.title} 
      class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
    />
    <div class="absolute inset-0 bg-gradient-to-r from-transparent to-[#0A1118]/50 md:hidden"></div>
    
    <div class="absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
      {property.status === 'available' ? 'bg-emerald-500 text-black' : 
       property.status === 'reserved' ? 'bg-amber-500 text-black' : 
       'bg-rose-500 text-white'}">
      {property.status}
    </div>
  </a>

  <!-- Content -->
  <div class="p-5 flex flex-col flex-grow justify-between gap-4">
    <div class="flex flex-col md:flex-row justify-between items-start gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-medium text-emerald-400 capitalize bg-emerald-900/30 px-2 py-0.5 rounded">
            {property.type}
          </span>
          {#if property.isVerified}
            <span class="flex items-center gap-1 text-xs text-emerald-400">
              <ShieldCheck size={14} /> Verified
            </span>
          {/if}
        </div>
        <a href="/properties/{property.id}">
          <h3 class="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
            {property.title}
          </h3>
        </a>
        <div class="flex items-center text-emerald-200/60 text-sm mt-1">
          <MapPin size={14} class="mr-1 flex-shrink-0" />
          <span>{property.location.address}, {property.location.state}</span>
        </div>
      </div>

      <div class="text-left md:text-right">
        <div class="text-2xl font-bold bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">
          ₦{(property.price).toLocaleString()}
        </div>
        <div class="text-xs text-stone-400">
          ₦{(property.pricePerSqm).toLocaleString()} / sqm
        </div>
      </div>
    </div>

    <!-- Middle row -->
    <div class="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center text-emerald-100/70 text-sm">
      <div class="flex items-center gap-4 bg-black/20 rounded-lg px-3 py-1.5 border border-white/5">
        <div class="flex items-center gap-1.5" title="Bedrooms"><Bed size={16} /> <span>{property.bedrooms || '-'}</span></div>
        <div class="w-px h-4 bg-white/10"></div>
        <div class="flex items-center gap-1.5" title="Bathrooms"><Bath size={16} /> <span>{property.bathrooms || '-'}</span></div>
        <div class="w-px h-4 bg-white/10"></div>
        <div class="flex items-center gap-1.5" title="Size (sqm)"><Square size={16} /> <span>{property.sizeSqm || '-'}</span></div>
      </div>
      
      <div class="flex flex-wrap gap-2">
        {#each property.amenities.slice(0, 3) as amenity}
          <span class="text-xs px-2 py-1 rounded-full border border-emerald-900/30 bg-emerald-950/20">{amenity}</span>
        {/each}
        {#if property.amenities.length > 3}
          <span class="text-xs px-2 py-1 rounded-full border border-white/10 bg-white/5">+{property.amenities.length - 3}</span>
        {/if}
      </div>
    </div>

    <!-- Bottom row -->
    <div class="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-white/5">
      <div class="flex items-center gap-3 w-full md:w-auto">
        <img src={property.agent.avatar} alt={property.agent.name} class="w-8 h-8 rounded-full border border-white/10" />
        <div>
          <div class="text-sm font-medium text-white">{property.agent.name}</div>
          <div class="text-xs text-emerald-400">{property.agent.agency}</div>
        </div>
      </div>

      <div class="flex items-center gap-3 w-full md:w-auto">
        <button
          on:click={toggleSave}
          class="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-black/30 border border-white/10 hover:bg-white/5 transition-colors"
          aria-label={isSaved ? 'Remove from saved properties' : 'Save property'}
          aria-pressed={isSaved}
        >
          <Heart size={18} class={isSaved ? "fill-rose-500 text-rose-500" : "text-white"} />
        </button>
        <button class="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors text-sm font-medium">
          <Phone size={16} /> Contact
        </button>
        <a href="/properties/{property.id}" class="flex-1 text-center md:flex-none px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors text-sm font-medium shadow-[0_0_15px_rgba(5,150,105,0.4)]">
          View Details
        </a>
      </div>
    </div>
  </div>
</div>
