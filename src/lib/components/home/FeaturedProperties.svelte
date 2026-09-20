<script lang="ts">
  import { MapPin, Bed, Bath, Square, ArrowRight } from 'lucide-svelte';
  import { reveal } from '$lib/actions/reveal';

  const properties = [
    {
      id: 1,
      title: 'Maitama Luxury Duplex',
      location: 'Maitama, Abuja',
      price: '185,000,000',
      beds: 5, baths: 6, size: '450',
      type: 'Duplex', status: 'Available',
      image: 'https://picsum.photos/seed/prop1/800/600'
    },
    {
      id: 2,
      title: 'Asokoro Skyline Penthouse',
      location: 'Asokoro, Abuja',
      price: '320,000,000',
      beds: 4, baths: 4.5, size: '320',
      type: 'Penthouse', status: 'Just Listed',
      image: 'https://picsum.photos/seed/prop2/800/600'
    },
    {
      id: 3,
      title: 'Wuse 2 Smart Apartment',
      location: 'Wuse 2, Abuja',
      price: '75,000,000',
      beds: 3, baths: 3, size: '180',
      type: 'Apartment', status: 'Available',
      image: 'https://picsum.photos/seed/prop3/800/600'
    },
    {
      id: 4,
      title: 'Gwarinpa Family Home',
      location: 'Gwarinpa, Abuja',
      price: '45,000,000',
      beds: 4, baths: 3, size: '250',
      type: 'House', status: 'Available',
      image: 'https://picsum.photos/seed/prop4/800/600'
    },
    {
      id: 5,
      title: 'Lekki Phase 1 Waterfront',
      location: 'Lekki Phase 1, Lagos',
      price: '220,000,000',
      beds: 5, baths: 5, size: '500',
      type: 'Villa', status: 'Hot Deal',
      image: 'https://picsum.photos/seed/prop5/800/600'
    },
    {
      id: 6,
      title: 'VI Commercial Plaza',
      location: 'Victoria Island, Lagos',
      price: '950,000,000',
      beds: 0, baths: 12, size: '1200',
      type: 'Commercial', status: 'Available',
      image: 'https://picsum.photos/seed/prop6/800/600'
    }
  ];

  // TODO: replace with useQuery(api.properties.list, {})
</script>

<style>
  .prop-card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  
  .prop-card:hover {
    transform: translateY(-10px);
    border-color: rgba(5, 150, 105, 0.4);
    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5), 0 0 20px rgba(5, 150, 105, 0.1);
  }
</style>

<section class="py-24 bg-[#050A0E] text-white" use:reveal>
  <div class="container mx-auto px-6">
    
    <div class="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
      <div>
        <h4 class="text-emerald-500 font-bold tracking-widest uppercase text-sm mb-2">Prime Listings</h4>
        <h2 class="text-3xl md:text-5xl font-extrabold">Featured Properties</h2>
      </div>
      <a href="/properties" class="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold group transition-colors">
        View All Properties 
        <ArrowRight size={18} class="group-hover:translate-x-1 transition-transform" />
      </a>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {#each properties as prop}
        <div class="prop-card rounded-2xl overflow-hidden group cursor-pointer flex flex-col h-full">
          <!-- Image Header -->
          <div class="relative h-64 overflow-hidden">
            <img src={prop.image} alt={prop.title} class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            <div class="absolute inset-0 bg-gradient-to-t from-[#050A0E] via-transparent to-transparent opacity-80"></div>
            
            <div class="absolute top-4 left-4">
              <span class="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 uppercase tracking-wider text-amber-400">
                {prop.type}
              </span>
            </div>
            
            <div class="absolute top-4 right-4">
              <span class="bg-emerald-500/90 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
                {prop.status}
              </span>
            </div>
          </div>

          <!-- Content -->
          <div class="p-6 flex flex-col flex-grow">
            <div class="mb-4">
              <h3 class="text-xl font-bold mb-2 group-hover:text-emerald-400 transition-colors">{prop.title}</h3>
              <p class="text-gray-400 text-sm flex items-center gap-1">
                <MapPin size={16} class="text-gray-500" /> {prop.location}
              </p>
            </div>

            <!-- Specs -->
            <div class="flex items-center justify-between py-4 border-y border-white/5 mb-4 text-sm text-gray-300">
              {#if prop.beds > 0}
                <div class="flex items-center gap-2"><Bed size={16} class="text-gray-500"/> {prop.beds} Beds</div>
              {/if}
              <div class="flex items-center gap-2"><Bath size={16} class="text-gray-500"/> {prop.baths} Baths</div>
              <div class="flex items-center gap-2"><Square size={16} class="text-gray-500"/> {prop.size} sqm</div>
            </div>

            <!-- Footer -->
            <div class="mt-auto flex items-center justify-between">
              <div>
                <p class="text-xs text-gray-500 mb-1">Asking Price</p>
                <p class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                  ₦{prop.price}
                </p>
              </div>
              <button class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:border-emerald-400 transition-all">
                <ArrowRight size={18} class="group-hover:text-white" />
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>

  </div>
</section>
