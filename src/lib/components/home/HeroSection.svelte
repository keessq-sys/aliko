<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();

  import {
    MapPin,
    CheckCircle2,
    TrendingUp,
    Search,
    MessageCircle,
  } from "lucide-svelte";
  import SearchBar from "./SearchBar.svelte";
  import { HERO_IMAGES } from "$lib/data/imagery";
  import { whatsappHref } from "$lib/data/contact";

  /**
   * Drop a real property walkthrough clip's URL here (mp4/webm, muted,
   * looping, <15s) to switch the hero background from image to video —
   * everything else (overlay, content, layout) stays the same.
   */
  export let heroVideoUrl: string | null = null;
</script>

<section
  class="theme-contrast-dark relative min-h-screen hero-bg flex items-center pt-24 pb-12 overflow-hidden text-white"
>
  <div class="hero-media">
    {#if heroVideoUrl}
      <video
        src={heroVideoUrl}
        poster={HERO_IMAGES.posterForFutureVideo}
        autoplay
        muted
        loop
        playsinline
      ></video>
    {:else}
      <img
        fetchpriority="high"
        decoding="async"
        src={HERO_IMAGES.home}
        alt={$adkT("Example residential architecture")}
      />
    {/if}
  </div>
  <div class="hero-scrim"></div>
  <div class="grid-floor"></div>

  <!-- Floating Orbs -->
  <div class="orb bg-emerald-600/20 w-96 h-96 top-20 left-10"></div>
  <div class="orb bg-amber-500/20 w-80 h-80 bottom-20 right-20"></div>

  <!-- Static brand accent: no WebGL import or perpetual animation -->
  <div
    class="absolute top-2 right-2 w-16 h-16 sm:top-4 sm:right-4 sm:w-24 sm:h-24 md:top-16 md:right-8 md:w-36 md:h-36 lg:top-20 lg:right-10 lg:w-52 lg:h-52 z-[1] pointer-events-none"
  >
    <div
      class="h-full w-full rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(52,211,153,0.35),rgba(217,119,6,0.15)_45%,transparent_70%)]"
    ></div>
  </div>

  <div
    class="container mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center gap-12"
  >
    <!-- Left Content -->
    <div class="w-full lg:w-1/2 flex flex-col gap-6 items-start">
      <div
        class="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-sm text-emerald-400 font-medium"
      >
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        {$adkT("Explore Nigerian property and services")}
      </div>

      <h1
        class="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight"
      >
        {$adkT("Find Your")} <br />
        <span
          class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600"
          >{$adkT("Diamond Key")}</span
        > <br />
        {$adkT("Property.")}
      </h1>

      <p class="text-lg md:text-xl text-gray-400 max-w-xl">
        {$adkT(
          "Browse reviewed property listings and request land, design, construction and property services. Confirm title and availability with our team before committing.",
        )}
      </p>

      <div class="w-full mt-4">
        <SearchBar />
      </div>

      <div class="hero-actions flex flex-wrap gap-4 mt-6">
        <a
          href="/properties"
          class="px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-xl font-bold text-white shadow-[0_0_20px_rgba(5,150,105,0.4)] transition-all hover:scale-105"
        >
          {$adkT("Browse Properties")}
        </a>
        <a
          href="/map"
          class="px-8 py-4 glass-panel rounded-xl font-bold hover:bg-white/10 transition-all flex items-center gap-2"
        >
          <MapPin size={20} />
          {$adkT("View on Map")}
        </a>
        <a
          href={whatsappHref(
            "Hi, I'd like to speak with someone about a property.",
          )}
          target="_blank"
          rel="noopener noreferrer"
          class="px-8 py-4 rounded-xl font-bold border border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-all flex items-center gap-2"
        >
          <MessageCircle size={20} />
          {$adkT("Chat on WhatsApp")}
        </a>
      </div>

      <div
        class="flex items-center gap-6 mt-8 text-sm text-gray-400 font-medium"
      >
        <span class="flex items-center gap-1"
          ><CheckCircle2 size={16} class="text-emerald-500" />
          {$adkT("Publication review")}</span
        >
        <span class="flex items-center gap-1"
          ><CheckCircle2 size={16} class="text-emerald-500" />
          {$adkT("Payment references")}</span
        >
        <span class="flex items-center gap-1"
          ><CheckCircle2 size={16} class="text-emerald-500" />
          {$adkT("Customer support")}</span
        >
      </div>
    </div>

    <!-- Right 3D Stack -->
    <div
      class="w-full lg:w-1/2 relative h-[600px] hidden lg:block"
      style="perspective: 1000px;"
    >
      <div
        class="absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-out"
      >
        <!-- Background Card (offset) -->
        <div
          class="absolute w-80 h-[450px] glass-panel rounded-3xl -right-10 -top-5 rotate-12 opacity-40"
        ></div>

        <!-- Foreground Featured Card -->
        <div
          class="relative w-96 h-[500px] glass-panel rounded-3xl p-4 flex flex-col gap-4 z-10 overflow-hidden group"
        >
          <div class="relative h-3/5 w-full rounded-2xl overflow-hidden">
            <img
              src="/Frontend%20UI%20Images/HOUSES/IMG-20260921-WA0228.jpg"
              alt={$adkT("Example residential architecture")}
              class="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
            />
            <div
              class="absolute top-4 left-4 bg-[#050a0e] backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/10 flex items-center gap-1"
            >
              <CheckCircle2 size={12} class="text-emerald-400" />
              {$adkT("Architecture showcase")}
            </div>
          </div>

          <div class="flex-1 flex flex-col justify-between px-2">
            <div>
              <h3 class="text-xl font-bold">
                {$adkT("Discover Nigerian homes")}
              </h3>
              <p class="text-gray-400 text-sm flex items-center gap-1 mt-1">
                <MapPin size={14} />
                {$adkT("Browse the published catalogue")}
              </p>
            </div>

            <div class="flex justify-between items-end">
              <div>
                <p class="text-xs text-gray-500 mb-1">
                  {$adkT("Listings become available after review")}
                </p>
                <p
                  class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500"
                >
                  {$adkT("Explore properties")}
                </p>
              </div>
              <div
                class="bg-emerald-500/20 text-emerald-400 p-2 rounded-xl border border-emerald-500/30 flex items-center gap-1"
              >
                <TrendingUp size={16} />
                <span class="text-xs font-bold">{$adkT("Enquire")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .hero-bg {
    background-color: #050a0e;
  }

  .hero-media {
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  .hero-media img,
  .hero-media video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .hero-scrim {
    position: absolute;
    inset: 0;
    z-index: 0;
    background:
      radial-gradient(at 0% 0%, rgba(5, 150, 105, 0.2) 0px, transparent 50%),
      radial-gradient(at 100% 0%, rgba(217, 119, 6, 0.12) 0px, transparent 50%),
      linear-gradient(
        to top,
        #050a0e 5%,
        rgba(5, 10, 14, 0.55) 55%,
        rgba(5, 10, 14, 0.75) 100%
      );
  }

  .grid-floor {
    position: absolute;
    bottom: -50%;
    left: -50%;
    width: 200%;
    height: 100%;
    background-image:
      linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(to top, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 50px 50px;
    transform: perspective(1000px) rotateX(75deg);
    pointer-events: none;
    z-index: 0;
  }

  .glass-panel {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .orb {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgba(5, 150, 105, 0.14),
      transparent 70%
    );
    z-index: 0;
    transition: transform 0.2s ease-out;
  }
</style>
