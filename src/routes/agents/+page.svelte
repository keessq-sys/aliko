<script lang="ts">
  import { Search, MapPin, Star, Verified, Filter, Phone, Mail } from 'lucide-svelte';

  const AGENTS = [
    { id: 1, name: "Oluwaseun Adeyemi", agency: "Apex Realtors Group", rating: 4.9, reviews: 128, listings: 45, exp: "8 yrs", verified: true, image: "https://i.pravatar.cc/150?u=1", specs: ["Residential", "Luxury"], location: "Lekki, Lagos" },
    { id: 2, name: "Ngozi Okafor", agency: "Diamond Key Estates", rating: 4.8, reviews: 95, listings: 32, exp: "5 yrs", verified: true, image: "https://i.pravatar.cc/150?u=2", specs: ["Commercial", "Land"], location: "Wuse, Abuja" },
    { id: 3, name: "Ibrahim Musa", agency: "Savannah Properties", rating: 4.7, reviews: 64, listings: 20, exp: "4 yrs", verified: true, image: "https://i.pravatar.cc/150?u=3", specs: ["Rentals", "Residential"], location: "Nassarawa, Kano" },
    { id: 4, name: "Chidi Eze", agency: "Sunrise Developers", rating: 4.9, reviews: 210, listings: 85, exp: "12 yrs", verified: true, image: "https://i.pravatar.cc/150?u=4", specs: ["Off-plan", "Investment"], location: "Victoria Island, Lagos" },
    { id: 5, name: "Aisha Bello", agency: "Capital Homes", rating: 4.6, reviews: 42, listings: 18, exp: "3 yrs", verified: true, image: "https://i.pravatar.cc/150?u=5", specs: ["Residential"], location: "Maitama, Abuja" },
    { id: 6, name: "Tunde Bakare", agency: "Mainland Realtors", rating: 4.5, reviews: 88, listings: 40, exp: "7 yrs", verified: true, image: "https://i.pravatar.cc/150?u=6", specs: ["Rentals", "Commercial"], location: "Ikeja, Lagos" },
    { id: 7, name: "Grace Chukwu", agency: "Independent", rating: 4.8, reviews: 112, listings: 28, exp: "6 yrs", verified: true, image: "https://i.pravatar.cc/150?u=7", specs: ["Luxury", "Diaspora"], location: "Enugu" },
    { id: 8, name: "Femi Peters", agency: "Peters & Co.", rating: 4.4, reviews: 35, listings: 15, exp: "2 yrs", verified: false, image: "https://i.pravatar.cc/150?u=8", specs: ["Land"], location: "Ibadan, Oyo" }
  ];

  let searchQuery = '';
</script>

<div class="min-h-screen bg-[#050A0E] text-white">
  <!-- CTA Banner -->
  <div class="bg-gradient-to-r from-amber-600 to-amber-800 px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between">
    <div class="text-sm font-medium mb-2 sm:mb-0">Are you a real estate professional? Reach more clients with ADK.</div>
    <a href="/register/agent" class="text-sm bg-black/30 hover:bg-black/50 text-white px-4 py-1.5 rounded-full transition-colors border border-white/20 whitespace-nowrap">
      Register as Agent &rarr;
    </a>
  </div>

  <div class="px-4 sm:px-6 lg:px-8 py-12 max-w-7xl mx-auto">
    <!-- Hero -->
    <div class="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <h1 class="text-4xl sm:text-5xl font-bold mb-4">Meet Our Verified Agents</h1>
        <p class="text-gray-400 text-lg max-w-2xl">Connect with top-rated real estate professionals across Nigeria. Every verified agent on our platform has undergone strict background and licensing checks.</p>
      </div>
      <div class="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
        <span class="text-2xl font-bold text-emerald-400">1,240+</span>
        <span class="text-sm text-gray-400 leading-tight">Active<br>Agents</span>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 mb-10 flex flex-col lg:flex-row gap-4">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" bind:value={searchQuery} placeholder="Search by name, agency, or location..." class="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
      </div>
      
      <div class="flex gap-4 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
        <select class="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 min-w-[150px]">
          <option>All Specializations</option>
          <option>Residential</option>
          <option>Commercial</option>
          <option>Land</option>
        </select>
        
        <select class="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 min-w-[150px]">
          <option>All Locations</option>
          <option>Lagos</option>
          <option>Abuja</option>
          <option>Kano</option>
        </select>
        
        <select class="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 min-w-[150px]">
          <option>Sort by: Rating</option>
          <option>Most Listings</option>
          <option>Experience</option>
        </select>
        
        <button class="bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl px-4 py-3 text-white transition-colors flex items-center gap-2">
          <Filter class="w-4 h-4" /> Clear
        </button>
      </div>
    </div>

    <!-- Agent Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {#each AGENTS as agent}
        <div class="group backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-emerald-500/50 hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 relative flex flex-col h-full">
          <!-- Avatar -->
          <div class="relative w-24 h-24 mx-auto mb-4">
            <img src={agent.image} alt={agent.name} class="w-full h-full rounded-full object-cover border-2 {agent.verified ? 'border-emerald-500' : 'border-gray-500'}" />
            {#if agent.verified}
              <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg shadow-emerald-500/20">
                <Verified class="w-3 h-3" /> VERIFIED
              </div>
            {/if}
          </div>

          <!-- Info -->
          <div class="text-center mb-4 flex-1">
            <h3 class="font-bold text-lg text-white group-hover:text-emerald-400 transition-colors">{agent.name}</h3>
            <p class="text-sm text-stone-400 mb-2">{agent.agency}</p>
            
            <div class="flex items-center justify-center gap-1 text-sm mb-3">
              <Star class="w-4 h-4 text-amber-400 fill-amber-400" />
              <span class="font-medium text-white">{agent.rating}</span>
              <span class="text-gray-500">({agent.reviews} reviews)</span>
            </div>

            <div class="flex flex-wrap justify-center gap-1.5 mb-3">
              {#each agent.specs as spec}
                <span class="text-[10px] bg-white/10 text-gray-300 px-2 py-1 rounded-md">{spec}</span>
              {/each}
            </div>

            <div class="flex items-center justify-center gap-1 text-xs text-gray-400">
              <MapPin class="w-3 h-3" /> {agent.location}
            </div>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-3 gap-2 border-t border-white/10 py-3 mb-4 text-center">
            <div>
              <div class="text-sm font-bold text-white">{agent.listings}</div>
              <div class="text-[10px] text-gray-500 uppercase">Listings</div>
            </div>
            <div class="border-x border-white/10">
              <div class="text-sm font-bold text-white">{agent.exp}</div>
              <div class="text-[10px] text-gray-500 uppercase">Exp</div>
            </div>
            <div>
              <div class="text-sm font-bold text-white">{Math.floor(agent.reviews * 1.5)}</div>
              <div class="text-[10px] text-gray-500 uppercase">Clients</div>
            </div>
          </div>

          <!-- Actions -->
          <div class="space-y-2">
            <button class="w-full py-2 bg-gradient-to-r from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 rounded-lg text-white text-sm font-medium transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              View Profile
            </button>
            <div class="grid grid-cols-2 gap-2 opacity-0 group-hover:opacity-100 h-0 group-hover:h-[36px] overflow-hidden transition-all duration-300">
              <button class="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white transition-colors">
                <Phone class="w-3 h-3" /> Call
              </button>
              <button class="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white transition-colors">
                <Mail class="w-3 h-3" /> Message
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Pagination -->
    <div class="flex justify-center mt-12 gap-2">
      <button class="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">&lt;</button>
      <button class="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 font-medium">1</button>
      <button class="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">2</button>
      <button class="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">3</button>
      <span class="w-10 h-10 flex items-center justify-center text-gray-500">...</span>
      <button class="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">&gt;</button>
    </div>
  </div>
</div>
