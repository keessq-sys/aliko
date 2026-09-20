<script lang="ts">
  import { page } from '$app/stores';
  import { properties as allPropertiesStore, type Property } from '$lib/stores/properties';
  import PropertyGallery from '$lib/components/properties/PropertyGallery.svelte';
  import PropertyCard from '$lib/components/properties/PropertyCard.svelte';
  import MapEmbed from '$lib/components/ui/MapEmbed.svelte';
  import { addToast } from '$lib/stores/ui';
  import { whatsappHref } from '$lib/data/contact';
  import {
    MapPin,
    Bed,
    Bath,
    Square,
    Car,
    Calendar,
    Home,
    ShieldCheck,
    Share2,
    Heart,
    Phone,
    Mail,
    MessageCircle,
    ChevronRight,
    TrendingUp,
    Percent,
    Building,
    CheckCircle2,
    Send
  } from 'lucide-svelte';

  $: propertyId = $page.params.id;
  $: property = $allPropertiesStore.find((p) => p.id === propertyId);
  $: similarProperties = $allPropertiesStore.filter((p) => p.id !== propertyId && (p.type === property?.type || p.location.state === property?.location.state)).slice(0, 3);

  let isSaved = false;
  let inquiryName = '';
  let inquiryEmail = '';
  let inquiryPhone = '';
  let inquiryMessage = 'Hello, I am interested in this property and would like more information or to schedule an inspection.';
  let isSendingInquiry = false;
  let isViewingModalOpen = false;
  let viewingDate = '';
  let viewingTime = '10:00';

  function handleSave() {
    isSaved = !isSaved;
    addToast({
      type: isSaved ? 'success' : 'info',
      message: isSaved ? 'Property saved to your wishlist!' : 'Property removed from wishlist'
    });
  }

  function handleShare() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast({
        type: 'success',
        message: 'Property link copied to clipboard!'
      });
    }
  }

  function submitInquiry(e: Event) {
    e.preventDefault();
    if (!inquiryName || !inquiryEmail) {
      addToast({
        type: 'error',
        message: 'Please provide your name and email address.'
      });
      return;
    }
    isSendingInquiry = true;
    setTimeout(() => {
      isSendingInquiry = false;
      addToast({
        type: 'success',
        message: `Inquiry sent to ${property?.agent.name}! They will contact you shortly.`
      });
      inquiryName = '';
      inquiryEmail = '';
      inquiryPhone = '';
    }, 800);
  }

  function scheduleViewing() {
    if (!viewingDate) {
      addToast({
        type: 'warning',
        message: 'Please select a date for your viewing.'
      });
      return;
    }
    addToast({
      type: 'success',
      message: `Viewing requested for ${viewingDate} at ${viewingTime}. The agent will confirm.`
    });
    isViewingModalOpen = false;
  }
</script>

<svelte:head>
  <title>{property ? `${property.title} — Aliko Diamond Key` : 'Property Details — Aliko Diamond Key'}</title>
</svelte:head>

<div class="min-h-screen bg-[#050A0E] text-white pb-20">
  {#if !property}
    <!-- Not Found State -->
    <div class="max-w-4xl mx-auto px-4 py-28 text-center">
      <div class="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mx-auto mb-6">
        <Home size={36} />
      </div>
      <h1 class="text-3xl font-serif font-bold text-white mb-3">Property Not Found</h1>
      <p class="text-stone-400 mb-8 max-w-md mx-auto text-sm">
        The property listing you are looking for may have been sold, unlisted, or does not exist.
      </p>
      <a
        href="/properties"
        class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-400 text-white font-semibold text-sm shadow-lg hover:shadow-emerald-500/20"
      >
        Browse All Properties
      </a>
    </div>
  {:else}
    <!-- Breadcrumb bar -->
    <div class="border-b border-white/5 bg-white/[0.01] py-4">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav class="flex items-center gap-2 text-xs text-stone-400">
          <a href="/" class="hover:text-emerald-400 transition-colors">Home</a>
          <ChevronRight size={12} />
          <a href="/properties" class="hover:text-emerald-400 transition-colors">Properties</a>
          <ChevronRight size={12} />
          <span class="text-emerald-400 truncate max-w-xs">{property.title}</span>
        </nav>
      </div>
    </div>

    <!-- Gallery & Top Header -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
      <!-- Title & Price Bar -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div class="flex flex-wrap items-center gap-2 mb-2">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider
              {property.status === 'available' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
               property.status === 'reserved' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 
               'bg-rose-500/20 text-rose-400 border border-rose-500/30'}">
              {property.status}
            </span>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-800 text-stone-300 border border-stone-700 capitalize">
              {property.type}
            </span>
            {#if property.isVerified}
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/60 border border-emerald-700/60 text-emerald-300">
                <ShieldCheck size={13} /> AGIS & Title Verified
              </span>
            {/if}
          </div>
          <h1 class="text-2xl sm:text-4xl font-serif font-bold text-white mb-2">
            {property.title}
          </h1>
          <div class="flex items-center gap-2 text-stone-400 text-sm">
            <MapPin size={16} class="text-emerald-500 flex-shrink-0" />
            <span>{property.location.address}, {property.location.lga}, {property.location.state}</span>
          </div>
        </div>

        <!-- Price & Action Buttons -->
        <div class="flex flex-row lg:flex-col items-end justify-between lg:justify-center gap-2">
          <div>
            <div class="text-xs text-stone-400 text-right uppercase tracking-wider font-mono">Guide Price</div>
            <div class="text-3xl sm:text-4xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
              ₦{(property.price / 1_000_000).toLocaleString()}M
            </div>
            {#if property.pricePerSqm}
              <div class="text-xs text-stone-500 text-right">
                ₦{property.pricePerSqm.toLocaleString()} / sqm
              </div>
            {/if}
          </div>

          <div class="flex items-center gap-2">
            <button
              on:click={handleShare}
              class="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 transition-colors"
              title="Share listing"
            >
              <Share2 size={18} />
            </button>
            <button
              on:click={handleSave}
              class="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 transition-colors"
              title="Save to wishlist"
            >
              <Heart size={18} class={isSaved ? "fill-rose-500 text-rose-500" : ""} />
            </button>
          </div>
        </div>
      </div>

      <!-- Gallery Slider -->
      <div class="mb-10">
        <PropertyGallery images={property.images} title={property.title} />
      </div>

      <!-- Main Layout: 2 Columns (68% Content, 32% Sticky Sidebar) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- Left Content (8 Cols) -->
        <div class="lg:col-span-8 space-y-8">
          
          <!-- Key Facts Grid (2x3 or 3x2) -->
          <div class="p-6 rounded-2xl bg-[#0A1118]/80 backdrop-blur-xl border border-white/10 shadow-xl">
            <h2 class="text-lg font-serif font-bold text-white mb-4">Property Overview</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                <div class="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Bed size={20} />
                </div>
                <div>
                  <div class="text-xs text-stone-400">Bedrooms</div>
                  <div class="text-base font-semibold text-white">{property.bedrooms} Beds</div>
                </div>
              </div>

              <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                <div class="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Bath size={20} />
                </div>
                <div>
                  <div class="text-xs text-stone-400">Bathrooms</div>
                  <div class="text-base font-semibold text-white">{property.bathrooms} Baths</div>
                </div>
              </div>

              <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                <div class="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Square size={20} />
                </div>
                <div>
                  <div class="text-xs text-stone-400">Land Area</div>
                  <div class="text-base font-semibold text-white">{property.sizeSqm} sqm</div>
                </div>
              </div>

              <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                <div class="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Car size={20} />
                </div>
                <div>
                  <div class="text-xs text-stone-400">Parking</div>
                  <div class="text-base font-semibold text-white">{property.parkingSpots} Cars</div>
                </div>
              </div>

              <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                <div class="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Calendar size={20} />
                </div>
                <div>
                  <div class="text-xs text-stone-400">Year Built</div>
                  <div class="text-base font-semibold text-white">{property.yearBuilt}</div>
                </div>
              </div>

              <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                <div class="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Building size={20} />
                </div>
                <div>
                  <div class="text-xs text-stone-400">Property Type</div>
                  <div class="text-base font-semibold text-white capitalize">{property.type}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Description Section -->
          <div class="p-6 rounded-2xl bg-[#0A1118]/80 backdrop-blur-xl border border-white/10 shadow-xl">
            <h2 class="text-lg font-serif font-bold text-white mb-4">About This Property</h2>
            <p class="text-stone-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {property.description}
            </p>

            {#if property.tags && property.tags.length > 0}
              <div class="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/5">
                {#each property.tags as tag}
                  <span class="px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                    #{tag}
                  </span>
                {/each}
              </div>
            {/if}
          </div>

          <!-- Amenities Section -->
          <div class="p-6 rounded-2xl bg-[#0A1118]/80 backdrop-blur-xl border border-white/10 shadow-xl">
            <h2 class="text-lg font-serif font-bold text-white mb-4">Features & Amenities</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {#each property.amenities as amenity}
                <div class="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-sm text-stone-300">
                  <CheckCircle2 size={16} class="text-emerald-400 flex-shrink-0" />
                  <span>{amenity}</span>
                </div>
              {/each}
            </div>
          </div>

          <!-- Location & Interactive Google/Leaflet Map -->
          <div class="p-6 rounded-2xl bg-[#0A1118]/80 backdrop-blur-xl border border-white/10 shadow-xl">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-lg font-serif font-bold text-white">Location & Neighbourhood</h2>
                <p class="text-stone-400 text-xs mt-0.5">{property.location.address}</p>
              </div>
              <a
                href="https://www.google.com/maps/search/?api=1&query={property.location.lat},{property.location.lng}"
                target="_blank"
                rel="noopener noreferrer"
                class="text-xs text-emerald-400 hover:text-emerald-300 underline"
              >
                Open in Google Maps ↗
              </a>
            </div>

            <!-- Map View -->
            <div class="rounded-xl overflow-hidden border border-white/10 mb-4">
              <MapEmbed
                lat={property.location.lat}
                lng={property.location.lng}
                zoom={15}
                height="320px"
                label={property.title}
              />
            </div>

            <!-- Nearby Landmarks Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <div class="text-xs text-stone-400">Airport (Nnamdi Azikiwe)</div>
                <div class="text-sm font-semibold text-emerald-400 mt-1">~25 mins</div>
              </div>
              <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <div class="text-xs text-stone-400">Central Business District</div>
                <div class="text-sm font-semibold text-emerald-400 mt-1">~10 mins</div>
              </div>
              <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <div class="text-xs text-stone-400">Top International Schools</div>
                <div class="text-sm font-semibold text-emerald-400 mt-1">~5 mins</div>
              </div>
              <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <div class="text-xs text-stone-400">Shopping Mall & Dining</div>
                <div class="text-sm font-semibold text-emerald-400 mt-1">~8 mins</div>
              </div>
            </div>
          </div>

          <!-- Investment & ROI Projections -->
          <div class="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-[#0A1118] to-[#0A1118] border border-emerald-900/40 shadow-xl">
            <div class="flex items-center gap-2 mb-4">
              <TrendingUp size={20} class="text-emerald-400" />
              <h2 class="text-lg font-serif font-bold text-white">Investment Performance Metrics</h2>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="p-4 rounded-xl bg-black/40 border border-white/5">
                <div class="text-xs text-stone-400 mb-1">Estimated Rental Yield</div>
                <div class="text-2xl font-bold text-emerald-400 font-mono">6.8% - 8.4%</div>
                <div class="text-[11px] text-stone-500 mt-1">Annual projected return based on district rentals</div>
              </div>
              <div class="p-4 rounded-xl bg-black/40 border border-white/5">
                <div class="text-xs text-stone-400 mb-1">Historical Capital Appreciation</div>
                <div class="text-2xl font-bold text-amber-400 font-mono">+24% / yr</div>
                <div class="text-[11px] text-stone-500 mt-1">Average 5-year FCT prime district trend</div>
              </div>
              <div class="p-4 rounded-xl bg-black/40 border border-white/5">
                <div class="text-xs text-stone-400 mb-1">Legal Risk Assessment</div>
                <div class="text-2xl font-bold text-emerald-300 font-mono">0.0% Clean</div>
                <div class="text-[11px] text-stone-500 mt-1">Certified C of O, AGIS verified registry</div>
              </div>
            </div>
          </div>

          <!-- Similar Properties Section -->
          {#if similarProperties.length > 0}
            <div class="pt-4">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-serif font-bold text-white">Similar Properties</h2>
                <a href="/properties" class="text-xs text-emerald-400 hover:underline">View all</a>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {#each similarProperties as simProp}
                  <PropertyCard property={simProp} />
                {/each}
              </div>
            </div>
          {/if}

        </div>

        <!-- Right Sticky Sidebar (4 Cols) -->
        <div class="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          
          <!-- Agent Contact Card -->
          <div class="p-6 rounded-2xl bg-[#0A1118]/90 backdrop-blur-xl border border-emerald-900/40 shadow-2xl">
            <div class="flex items-center gap-4 pb-4 border-b border-white/10 mb-4">
              <img
                src={property.agent.avatar}
                alt={property.agent.name}
                class="w-14 h-14 rounded-full object-cover border-2 border-emerald-500/50"
              />
              <div>
                <div class="flex items-center gap-1.5">
                  <h3 class="font-semibold text-white text-base">{property.agent.name}</h3>
                  <ShieldCheck size={14} class="text-emerald-400" />
                </div>
                <p class="text-xs text-stone-400">{property.agent.agency}</p>
                <div class="flex items-center gap-1 mt-1 text-xs text-amber-400 font-semibold">
                  ★ {property.agent.rating} (48 reviews)
                </div>
              </div>
            </div>

            <!-- Quick Agent Actions -->
            <div class="grid grid-cols-3 gap-2 mb-6">
              <a
                href="tel:{property.agent.phone}"
                class="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 hover:bg-emerald-900/30 border border-white/10 text-xs font-medium text-stone-300 hover:text-emerald-400 transition-colors"
              >
                <Phone size={16} class="mb-1 text-emerald-400" />
                <span>Call</span>
              </a>
              <a
                href={whatsappHref(`Hi, I'm interested in ${property.title} (via ${property.agent.name}).`)}
                target="_blank"
                rel="noopener noreferrer"
                class="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 hover:bg-emerald-900/30 border border-white/10 text-xs font-medium text-stone-300 hover:text-emerald-400 transition-colors"
              >
                <MessageCircle size={16} class="mb-1 text-emerald-400" />
                <span>WhatsApp</span>
              </a>
              <a
                href="mailto:{property.agent.email}?subject=Inquiry%20regarding%20{property.title}"
                class="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 hover:bg-emerald-900/30 border border-white/10 text-xs font-medium text-stone-300 hover:text-emerald-400 transition-colors"
              >
                <Mail size={16} class="mb-1 text-emerald-400" />
                <span>Email</span>
              </a>
            </div>

            <!-- Schedule Inspection CTA Button -->
            <button
              on:click={() => isViewingModalOpen = true}
              class="w-full mb-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-300 text-black font-bold text-sm shadow-lg hover:shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              📅 Schedule Physical Inspection
            </button>

            <!-- Direct Contact Form -->
            <form on:submit={submitInquiry} class="space-y-3 pt-4 border-t border-white/10">
              <h4 class="text-xs uppercase font-mono tracking-wider text-stone-400">Send Direct Inquiry</h4>
              <div>
                <input
                  type="text"
                  bind:value={inquiryName}
                  placeholder="Your Full Name"
                  required
                  class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <input
                  type="email"
                  bind:value={inquiryEmail}
                  placeholder="Email Address"
                  required
                  class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <input
                  type="tel"
                  bind:value={inquiryPhone}
                  placeholder="Phone Number (+234)"
                  class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <textarea
                  bind:value={inquiryMessage}
                  rows="3"
                  class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 resize-none"
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={isSendingInquiry}
                class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition-colors"
              >
                {#if isSendingInquiry}
                  <span>Sending message...</span>
                {:else}
                  <Send size={14} />
                  <span>Send Message to Agent</span>
                {/if}
              </button>
            </form>
          </div>

          <!-- Title & Guarantee Box -->
          <div class="p-5 rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-stone-400 space-y-2">
            <div class="flex items-center gap-2 text-white font-semibold">
              <ShieldCheck size={16} class="text-emerald-400" />
              <span>100% Legal Guarantee</span>
            </div>
            <p>
              Every transaction on Aliko Diamond Key is backed by our full money-back guarantee and verified through AGIS / state land registries.
            </p>
          </div>

        </div>

      </div>
    </div>
  {/if}
</div>

<!-- Schedule Inspection Modal -->
{#if isViewingModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div
      on:click={() => isViewingModalOpen = false}
      class="absolute inset-0 bg-black/80 backdrop-blur-md"
      role="presentation"
    ></div>

    <!-- Modal Box -->
    <div class="relative w-full max-w-md bg-[#0A1118] border border-emerald-900/50 rounded-2xl p-6 shadow-2xl z-10">
      <h3 class="text-xl font-serif font-bold text-white mb-2">Schedule Property Inspection</h3>
      <p class="text-xs text-stone-400 mb-6">
        Select your preferred date and time. Our verified agent will meet you on site or provide a virtual guided tour.
      </p>

      <div class="space-y-4 mb-6">
        <div>
          <label for="viewing-date" class="block text-xs font-medium text-stone-300 mb-1">Preferred Date</label>
          <input
            id="viewing-date"
            type="date"
            bind:value={viewingDate}
            min={new Date().toISOString().split('T')[0]}
            class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label for="viewing-time" class="block text-xs font-medium text-stone-300 mb-1">Preferred Time</label>
          <select
            id="viewing-time"
            bind:value={viewingTime}
            class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="09:00" class="bg-[#0A1628]">09:00 AM</option>
            <option value="11:00" class="bg-[#0A1628]">11:00 AM</option>
            <option value="14:00" class="bg-[#0A1628]">02:00 PM</option>
            <option value="16:00" class="bg-[#0A1628]">04:00 PM</option>
          </select>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3">
        <button
          on:click={() => isViewingModalOpen = false}
          class="px-4 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-white"
        >
          Cancel
        </button>
        <button
          on:click={scheduleViewing}
          class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg"
        >
          Confirm Request
        </button>
      </div>
    </div>
  </div>
{/if}
