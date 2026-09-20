<script lang="ts">
  import { onMount } from 'svelte';
  import { MapPin, CheckCircle2, TrendingUp, Search } from 'lucide-svelte';
  import SearchBar from './SearchBar.svelte';
  import { fade } from 'svelte/transition';
  import { HERO_IMAGES } from '$lib/data/imagery';

  /**
   * Drop a real property walkthrough clip's URL here (mp4/webm, muted,
   * looping, <15s) to switch the hero background from image to video —
   * everything else (overlay, content, layout) stays the same.
   */
  export let heroVideoUrl: string | null = null;

  let mouseX = 0;
  let mouseY = 0;
  let cardRotateX = 0;
  let cardRotateY = 0;

  let mounted = false;

  onMount(() => {
    mounted = true;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      cardRotateY = ((mouseX - centerX) / window.innerWidth) * 20;
      cardRotateX = ((mouseY - centerY) / window.innerHeight) * -20;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  });
</script>

<style>
  .hero-bg {
    background-color: #050A0E;
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
    animation: kenburns 22s ease-in-out infinite alternate;
  }

  .hero-scrim {
    position: absolute;
    inset: 0;
    z-index: 0;
    background:
      radial-gradient(at 0% 0%, rgba(5, 150, 105, 0.2) 0px, transparent 50%),
      radial-gradient(at 100% 0%, rgba(217, 119, 6, 0.12) 0px, transparent 50%),
      linear-gradient(to top, #050A0E 5%, rgba(5, 10, 14, 0.55) 55%, rgba(5, 10, 14, 0.75) 100%);
  }

  @keyframes kenburns {
    0% { transform: scale(1) translate(0, 0); }
    100% { transform: scale(1.12) translate(-1%, -1%); }
  }

  .grid-floor {
    position: absolute;
    bottom: -50%;
    left: -50%;
    width: 200%;
    height: 100%;
    background-image: 
      linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(to top, rgba(255,255,255,0.03) 1px, transparent 1px);
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
    filter: blur(80px);
    z-index: 0;
    transition: transform 0.2s ease-out;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-20px) scale(1.05); }
  }

  .floating {
    animation: float 6s ease-in-out infinite;
  }
</style>

<section class="relative min-h-screen hero-bg flex items-center pt-24 pb-12 overflow-hidden text-white">
  <div class="hero-media">
    {#if heroVideoUrl}
      <video src={heroVideoUrl} poster={HERO_IMAGES.posterForFutureVideo} autoplay muted loop playsinline></video>
    {:else}
      <img src={HERO_IMAGES.home} alt="Premium property skyline" />
    {/if}
  </div>
  <div class="hero-scrim"></div>
  <div class="grid-floor"></div>

  <!-- Floating Orbs -->
  <div class="orb bg-emerald-600/20 w-96 h-96 top-20 left-10" style="transform: translate({mouseX * -0.02}px, {mouseY * -0.02}px);"></div>
  <div class="orb bg-amber-500/20 w-80 h-80 bottom-20 right-20" style="transform: translate({mouseX * 0.02}px, {mouseY * 0.02}px);"></div>

  <div class="container mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center gap-12">
    
    <!-- Left Content -->
    <div class="w-full lg:w-1/2 flex flex-col gap-6 items-start">
      {#if mounted}
        <div transition:fade={{duration: 800, delay: 100}} class="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-sm text-emerald-400 font-medium">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Nigeria's Most Trusted Real Estate Platform
        </div>

        <h1 transition:fade={{duration: 800, delay: 200}} class="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
          Find Your <br/>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">Diamond Key</span> <br/>
          Property.
        </h1>

        <p transition:fade={{duration: 800, delay: 300}} class="text-lg md:text-xl text-gray-400 max-w-xl">
          Discover ultra-premium homes, land, and commercial spaces across Nigeria with our government-verified, zero-fraud guarantee.
        </p>

        <div transition:fade={{duration: 800, delay: 400}} class="w-full mt-4">
          <SearchBar />
        </div>

        <div transition:fade={{duration: 800, delay: 500}} class="flex flex-wrap gap-4 mt-6">
          <button class="px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-xl font-bold text-white shadow-[0_0_20px_rgba(5,150,105,0.4)] transition-all hover:scale-105">
            Browse Properties
          </button>
          <button class="px-8 py-4 glass-panel rounded-xl font-bold hover:bg-white/10 transition-all flex items-center gap-2">
            <MapPin size={20} /> View on Map
          </button>
        </div>

        <div transition:fade={{duration: 800, delay: 600}} class="flex items-center gap-6 mt-8 text-sm text-gray-400 font-medium">
          <span class="flex items-center gap-1"><CheckCircle2 size={16} class="text-emerald-500"/> 500+ Plots</span>
          <span class="flex items-center gap-1"><CheckCircle2 size={16} class="text-emerald-500"/> ₦12B+ Transacted</span>
          <span class="flex items-center gap-1"><CheckCircle2 size={16} class="text-emerald-500"/> 98% Satisfaction</span>
        </div>
      {/if}
    </div>

    <!-- Right 3D Stack -->
    <div class="w-full lg:w-1/2 relative h-[600px] hidden lg:block perspective-1000">
      {#if mounted}
        <div transition:fade={{duration: 1000, delay: 300}} 
             class="absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-out"
             style="transform: rotateX({cardRotateX}deg) rotateY({cardRotateY}deg);">
          
          <!-- Background Card (offset) -->
          <div class="absolute w-80 h-[450px] glass-panel rounded-3xl -right-10 -top-5 rotate-12 opacity-40"></div>
          
          <!-- Foreground Featured Card -->
          <div class="relative w-96 h-[500px] glass-panel rounded-3xl p-4 flex flex-col gap-4 floating z-10 overflow-hidden group">
            <div class="relative h-3/5 w-full rounded-2xl overflow-hidden">
              <img src="https://picsum.photos/seed/maitama1/800/600" alt="Maitama Villa" class="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" />
              <div class="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/10 flex items-center gap-1">
                <CheckCircle2 size={12} class="text-emerald-400" /> Verified ✓
              </div>
            </div>
            
            <div class="flex-1 flex flex-col justify-between px-2">
              <div>
                <h3 class="text-xl font-bold">Maitama Luxury Villa</h3>
                <p class="text-gray-400 text-sm flex items-center gap-1 mt-1"><MapPin size={14}/> FCT, Abuja</p>
              </div>
              
              <div class="flex justify-between items-end">
                <div>
                  <p class="text-xs text-gray-500 mb-1">Listed Price</p>
                  <p class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">₦185,000,000</p>
                </div>
                <div class="bg-emerald-500/20 text-emerald-400 p-2 rounded-xl border border-emerald-500/30 flex items-center gap-1">
                  <TrendingUp size={16} /> <span class="text-xs font-bold">+31% ROI</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      {/if}
    </div>

  </div>
</section>
