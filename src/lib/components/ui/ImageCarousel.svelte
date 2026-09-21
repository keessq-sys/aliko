<script lang="ts">
  import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-svelte';
  import { onDestroy, onMount } from 'svelte';

  export let images: string[] = [];
  export let autoPlay: boolean = false;
  export let showThumbnails: boolean = true;
  export let aspectRatio: string = 'aspect-video';

  let currentIndex = 0;
  let isFullscreen = false;
  let intervalId: ReturnType<typeof setInterval>;

  function next() {
    currentIndex = (currentIndex + 1) % images.length;
  }

  function prev() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
  }

  function goTo(index: number) {
    currentIndex = index;
  }

  function toggleFullscreen() {
    isFullscreen = !isFullscreen;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'Escape' && isFullscreen) isFullscreen = false;
  }

  let touchStartX = 0;
  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.changedTouches[0].screenX;
  }
  function handleTouchEnd(e: TouchEvent) {
    const touchEndX = e.changedTouches[0].screenX;
    if (touchEndX < touchStartX - 50) next();
    if (touchEndX > touchStartX + 50) prev();
  }

  onMount(() => {
    if (autoPlay && images.length > 1) {
      intervalId = setInterval(next, 5000);
    }
  });

  onDestroy(() => {
    if (intervalId) clearInterval(intervalId);
  });
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="relative group {isFullscreen ? 'fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl' : 'w-full'} flex flex-col">
  
  <!-- Main Image Container -->
  <div
    class="relative overflow-hidden bg-stone-900 {isFullscreen ? 'flex-1 h-full' : `${aspectRatio} rounded-2xl`}"
    role="region"
    aria-roledescription="carousel"
    aria-label="Image gallery"
    on:touchstart={handleTouchStart}
    on:touchend={handleTouchEnd}
  >
    {#if images.length > 0}
      <div 
        class="flex w-full h-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style="transform: translateX(-{currentIndex * 100}%)"
      >
        {#each images as img}
          <div class="w-full h-full flex-shrink-0 flex items-center justify-center p-0">
            <img 
              src={img} 
              alt="Gallery item" 
              class="w-full h-full object-cover {isFullscreen ? 'object-contain p-4' : ''}"
              loading="lazy"
            />
          </div>
        {/each}
      </div>
    {:else}
      <div class="w-full h-full flex items-center justify-center text-stone-500">
        No images available
      </div>
    {/if}

    <!-- Overlays (Arrows, Counters, Actions) -->
    {#if images.length > 1}
      <button
        class="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-black/40 text-white backdrop-blur-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-black/60 z-10"
        on:click|stopPropagation={prev}
        aria-label="Previous image"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        class="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-black/40 text-white backdrop-blur-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-black/60 z-10"
        on:click|stopPropagation={next}
        aria-label="Next image"
      >
        <ChevronRight size={24} />
      </button>

      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-xs font-mono backdrop-blur-md z-10">
        {currentIndex + 1} / {images.length}
      </div>
    {/if}

    <button
      class="absolute top-4 right-4 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-black/40 text-white backdrop-blur-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-black/60 z-10"
      on:click|stopPropagation={toggleFullscreen}
      aria-label={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
    >
      {#if isFullscreen}
        <Minimize2 size={20} />
      {:else}
        <Maximize2 size={20} />
      {/if}
    </button>
  </div>

  <!-- Thumbnails -->
  {#if showThumbnails && images.length > 1 && !isFullscreen}
    <div class="flex gap-2 mt-2 overflow-x-auto pb-2 scrollbar-hide">
      {#each images as img, i}
        <button 
          class="relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all {i === currentIndex ? 'ring-2 ring-emerald-500' : 'opacity-60 hover:opacity-100'}"
          on:click={() => goTo(i)}
        >
          <img src={img} alt="Thumbnail {i+1}" class="w-full h-full object-cover" />
          {#if i === currentIndex}
            <div class="absolute inset-0 bg-emerald-500/20"></div>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
