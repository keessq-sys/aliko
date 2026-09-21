<script lang="ts">
  import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-svelte';

  export let images: string[] = [];
  export let title: string = '';

  let currentIndex = 0;
  let isFullscreen = false;

  function next() {
    currentIndex = (currentIndex + 1) % images.length;
  }

  function prev() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (isFullscreen) {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') isFullscreen = false;
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="relative w-full rounded-2xl overflow-hidden bg-[#050A0E] border border-white/5">
  <!-- Main Image -->
  <div class="relative aspect-[4/3] md:aspect-[16/9] bg-black group">
    {#each images as img, i}
      <img 
        src={img} 
        alt="{title} - image {i+1}" 
        class="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 {i === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}"
      />
    {/each}
    
    <!-- Controls -->
    <div class="absolute inset-0 z-20 pointer-events-none flex items-center justify-between p-4">
      <button on:click={prev} aria-label="Previous image" class="pointer-events-auto flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-emerald-500/80 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"><ChevronLeft size={24} /></button>
      <button on:click={next} aria-label="Next image" class="pointer-events-auto flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-emerald-500/80 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"><ChevronRight size={24} /></button>
    </div>

    <!-- Badge & Expand -->
    <div class="absolute bottom-4 right-4 z-20 flex gap-2">
      <div class="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-sm font-medium border border-white/10">
        {currentIndex + 1} / {images.length}
      </div>
      <button on:click={() => isFullscreen = true} aria-label="View fullscreen" class="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-white/20 transition-colors">
        <Maximize2 size={20} />
      </button>
    </div>
  </div>

  <!-- Thumbnails -->
  <div class="flex overflow-x-auto gap-2 p-2 custom-scrollbar bg-black/20">
    {#each images as img, i}
      <button 
        on:click={() => currentIndex = i}
        class="relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors {i === currentIndex ? 'border-emerald-500' : 'border-transparent opacity-60 hover:opacity-100'}"
      >
        <img src={img} alt="thumbnail" class="w-full h-full object-cover" />
      </button>
    {/each}
  </div>
</div>

<!-- Fullscreen Modal -->
{#if isFullscreen}
  <div class="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col">
    <div class="p-4 flex justify-between items-center text-white">
      <div class="font-medium">{currentIndex + 1} / {images.length} - {title}</div>
      <button on:click={() => isFullscreen = false} aria-label="Close" class="flex items-center justify-center min-h-[44px] min-w-[44px] hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
    </div>

    <div class="flex-1 relative flex items-center justify-center p-4">
      <img src={images[currentIndex]} alt={title} class="max-w-full max-h-full object-contain" />
      <button on:click={prev} aria-label="Previous image" class="absolute left-2 md:left-8 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-black/50 text-white hover:bg-emerald-500/80"><ChevronLeft size={32} /></button>
      <button on:click={next} aria-label="Next image" class="absolute right-2 md:right-8 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-black/50 text-white hover:bg-emerald-500/80"><ChevronRight size={32} /></button>
    </div>
  </div>
{/if}

<style>
  .custom-scrollbar::-webkit-scrollbar { height: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
</style>
