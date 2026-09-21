<script lang="ts">
  import { Heart, Calendar, FileText, MessageSquare, User, MapPin, Bed, Bath, Download, CalendarPlus, X, Inbox, ArrowRight } from 'lucide-svelte';
  import { useQuery } from '$lib/convex/queries';
  import { api } from '$lib/convex/_generated/api';
  import { formatNaira } from '$lib/utils/format';
  import { REQUEST_STATUS_META } from '$lib/types/services';
  import { fly } from 'svelte/transition';

  let currentTab = 'requests';

  const SAVED_PROPERTIES = [
    { id: 'p1', title: 'Maitama Luxury Villa', price: 850000000, beds: 5, baths: 6, location: 'Maitama, Abuja', image: 'https://picsum.photos/seed/prop1/400/300', date: '2 days ago' },
    { id: 'p2', title: 'Asokoro Penthouse', price: 550000000, beds: 4, baths: 4, location: 'Asokoro, Abuja', image: 'https://picsum.photos/seed/prop4/400/300', date: '1 week ago' },
  ];

  const VIEWINGS = [
    { id: 'v1', property: 'Maitama Luxury Villa', date: 'Oct 24, 2024', time: '10:00 AM', agent: 'Adaeze Okonkwo', status: 'Confirmed', phone: '+2348011111111', image: 'https://picsum.photos/seed/prop1/100/100' },
  ];

  const DOCUMENTS = [
    { id: 'd1', name: 'Offer_Letter_Maitama.pdf', type: 'Agreement', property: 'Maitama Luxury Villa', date: '2024-09-18', size: '1.2 MB' },
    { id: 'd2', name: 'Payment_Receipt_001.pdf', type: 'Receipt', property: 'Maitama Luxury Villa', date: '2024-09-19', size: '0.5 MB' },
  ];

  const tabs = [
    { id: 'requests', label: 'My Requests', icon: Inbox },
    { id: 'saved', label: 'Saved', icon: Heart },
    { id: 'viewings', label: 'Viewings', icon: Calendar },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  // Live service requests submitted by this client (falls back to demo rows when signed out)
  const myRequests = useQuery(api.serviceRequests.getMyRequests, {});

  const DEMO_REQUESTS = [
    { _id: 'demo-1', reference: 'ADK-SVC-2026-4821', serviceSlug: 'turkish-tiles-supply', requestType: 'SUPPLY_CONTRACT', status: 'QUOTED', quoteAmount: 4_200_000, adminResponse: 'Quote attached: 480sqm Turkish porcelain incl. delivery to Lekki. Valid 14 days.', createdAt: Date.now() - 6 * 86400_000 },
    { _id: 'demo-2', reference: 'ADK-SVC-2026-5107', serviceSlug: 'interior-design', requestType: 'INTERIOR_DESIGN', status: 'REVIEWING', adminResponse: undefined, createdAt: Date.now() - 2 * 86400_000 },
  ];
  $: requests = $myRequests === undefined ? undefined : $myRequests.length > 0 ? $myRequests : DEMO_REQUESTS;
</script>

<div class="min-h-screen bg-[#050A0E] text-stone-300 font-sans">
  
  <!-- Top Navigation -->
  <header class="border-b border-white/5 bg-[#050A0E]/80 backdrop-blur-md sticky top-0 z-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
             <span class="text-white font-bold">C</span>
          </div>
          <h1 class="text-xl font-bold text-white">Client Portal</h1>
        </div>
        <div class="flex items-center gap-4">
          <button class="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 border border-white/20" aria-label="Account">
            <img src="https://picsum.photos/seed/client/100/100" alt="Client" class="w-8 h-8 rounded-full object-cover" />
          </button>
        </div>
      </div>
      
      <!-- Tabs -->
      <nav class="flex space-x-8 overflow-x-auto hide-scrollbar">
        {#each tabs as tab}
          <button 
            on:click={() => currentTab = tab.id}
            class="whitespace-nowrap flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors {currentTab === tab.id ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-white hover:border-white/20'}"
          >
            <svelte:component this={tab.icon} class="w-4 h-4" />
            {tab.label}
          </button>
        {/each}
      </nav>
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

    {#key currentTab}
    <div in:fly={{ y: 10, duration: 220, delay: 80 }}>
    {#if currentTab === 'requests'}
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-xl font-semibold text-white">My Service Requests</h2>
        <a href="/services" class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500">
          New Request <ArrowRight class="h-4 w-4" />
        </a>
      </div>

      {#if requests === undefined}
        <div class="grid grid-cols-1 gap-4">
          {#each Array(2) as _}
            <div class="skeleton h-24 rounded-xl"></div>
          {/each}
        </div>
      {:else if requests.length === 0}
        <div class="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] py-16 text-center">
          <Inbox class="mb-3 h-12 w-12 text-stone-700" />
          <p class="mb-1 font-medium text-white">No requests yet</p>
          <p class="mb-6 max-w-sm text-sm text-stone-400">Submit a request for interior design, Turkish tiles, smart homes, construction or any of our eight services.</p>
          <a href="/services" class="btn-primary px-6 py-2.5 text-sm">Browse Services</a>
        </div>
      {:else}
        <div class="space-y-4">
          {#each requests as req (req._id)}
            <div class="rounded-xl border border-white/5 bg-white/[0.02] p-5">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div class="flex items-center gap-3">
                    <h3 class="font-semibold text-white">{req.requestType.replace(/_/g, ' ')}</h3>
                    <span class="rounded-full px-2.5 py-0.5 text-[11px] font-bold {REQUEST_STATUS_META[req.status]?.classes ?? ''}">
                      {REQUEST_STATUS_META[req.status]?.label ?? req.status}
                    </span>
                  </div>
                  <p class="mt-0.5 font-mono text-xs text-stone-600">{req.reference} · {req.serviceSlug}</p>
                </div>
                {#if req.quoteAmount}
                  <div class="text-right">
                    <p class="text-[10px] uppercase tracking-wider text-stone-600">Quote</p>
                    <p class="font-bold text-amber-400">{formatNaira(req.quoteAmount)}</p>
                  </div>
                {/if}
              </div>
              {#if req.adminResponse}
                <div class="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-emerald-500">ADK Response</p>
                  <p class="mt-1 text-sm text-emerald-100">{req.adminResponse}</p>
                </div>
              {:else}
                <p class="mt-3 text-xs text-stone-500">Our admin desk responds within 48 hours of submission.</p>
              {/if}
            </div>
          {/each}
        </div>
      {/if}

    {:else if currentTab === 'saved'}
      <div class="mb-6 flex justify-between items-center">
        <h2 class="text-xl font-semibold text-white">Your Wishlist ({SAVED_PROPERTIES.length} properties)</h2>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each SAVED_PROPERTIES as prop}
          <div class="rounded-xl border border-white/5 bg-[#050A0E]/80 overflow-hidden shadow-xl group">
            <div class="relative h-48 w-full overflow-hidden">
              <img src={prop.image} alt={prop.title} class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <button class="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-emerald-400 hover:bg-rose-500/80 hover:text-white transition-colors backdrop-blur-md">
                <Heart class="w-4 h-4 fill-current" />
              </button>
              <div class="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs text-white">
                Saved {prop.date}
              </div>
            </div>
            <div class="p-5">
              <h3 class="text-lg font-semibold text-white truncate">{prop.title}</h3>
              <p class="text-emerald-400 font-bold mt-1">₦{(prop.price/1000000).toFixed(1)}M</p>
              
              <div class="flex items-center gap-4 mt-3 text-sm text-stone-400">
                <span class="flex items-center gap-1"><Bed class="w-4 h-4" /> {prop.beds} Beds</span>
                <span class="flex items-center gap-1"><Bath class="w-4 h-4" /> {prop.baths} Baths</span>
              </div>
              <p class="flex items-center gap-1 mt-2 text-sm text-stone-500 truncate">
                <MapPin class="w-4 h-4" /> {prop.location}
              </p>
              
              <button class="w-full mt-4 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 py-2 rounded-lg font-medium transition-colors">
                Schedule Viewing
              </button>
            </div>
          </div>
        {/each}
      </div>

    {:else if currentTab === 'viewings'}
      <div class="mb-6 flex justify-between items-center">
        <h2 class="text-xl font-semibold text-white">Upcoming Viewings</h2>
        <button class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <CalendarPlus class="w-4 h-4" /> Schedule New
        </button>
      </div>
      
      <div class="space-y-4">
        {#each VIEWINGS as view}
          <div class="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
            <img src={view.image} alt="Property" class="w-24 h-24 rounded-lg object-cover" />
            <div class="flex-1">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="text-lg font-medium text-white">{view.property}</h3>
                  <p class="text-emerald-400 font-medium mt-1">{view.date} at {view.time}</p>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {view.status}
                </span>
              </div>
              <div class="mt-4 flex flex-wrap gap-4 text-sm">
                <span class="flex items-center gap-1 text-stone-400"><User class="w-4 h-4" /> Agent: {view.agent}</span>
                <span class="flex items-center gap-1 text-stone-400"><MapPin class="w-4 h-4" /> {view.phone}</span>
              </div>
            </div>
            <div class="flex sm:flex-col gap-2 justify-end sm:border-l border-white/5 sm:pl-4">
              <button class="flex-1 sm:flex-none px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white">Reschedule</button>
              <button class="flex-1 sm:flex-none px-4 py-2 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        {/each}
      </div>
      
    {:else if currentTab === 'documents'}
      <h2 class="text-xl font-semibold text-white mb-6">My Documents</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each DOCUMENTS as doc}
          <div class="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-start gap-4">
            <div class="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
              <FileText class="w-6 h-6" />
            </div>
            <div class="flex-1">
              <h4 class="text-sm font-medium text-white mb-1">{doc.name}</h4>
              <p class="text-xs text-stone-400">{doc.property}</p>
              <div class="mt-2 flex justify-between items-center text-xs text-stone-500">
                <span>{doc.date}</span>
                <span>{doc.size}</span>
              </div>
            </div>
            <button class="p-2 hover:bg-white/10 rounded-full text-stone-400 hover:text-white">
              <Download class="w-4 h-4" />
            </button>
          </div>
        {/each}
      </div>
      
    {:else if currentTab === 'profile'}
      <div class="max-w-2xl mx-auto">
        <div class="rounded-xl border border-white/5 bg-white/[0.02] p-6 sm:p-8">
          <h2 class="text-xl font-semibold text-white mb-6 border-b border-white/10 pb-4">Personal Information</h2>
          <form class="space-y-6">
            <div class="flex items-center gap-4 mb-8">
              <img src="https://picsum.photos/seed/client/100/100" alt="Profile" class="w-20 h-20 rounded-full border-2 border-emerald-500/50" />
              <button type="button" class="px-4 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/10 text-white">Change Photo</button>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label for="client-name" class="text-sm text-stone-400">Full Name</label>
                <input id="client-name" type="text" value="Amara Eze" class="w-full bg-[#050A0E] border border-white/10 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none" />
              </div>
              <div class="space-y-2">
                <label for="client-email" class="text-sm text-stone-400">Email</label>
                <input id="client-email" type="email" value="amara@example.com" class="w-full bg-[#050A0E] border border-white/10 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none" />
              </div>
              <div class="space-y-2">
                <label for="client-phone" class="text-sm text-stone-400">Phone</label>
                <input id="client-phone" type="tel" value="+234 801 111 1111" class="w-full bg-[#050A0E] border border-white/10 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none" />
              </div>
            </div>
            
            <div class="pt-4 flex justify-end">
              <button type="button" class="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
      
    {:else}
      <div class="flex flex-col items-center justify-center py-20 text-stone-500">
         <MessageSquare class="w-16 h-16 mb-4 opacity-20" />
         <p>No messages yet.</p>
      </div>
    {/if}
    </div>
    {/key}
  </main>
</div>

<style>
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
