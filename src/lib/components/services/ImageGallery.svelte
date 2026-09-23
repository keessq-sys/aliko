<script lang="ts">
  import { X, ChevronLeft, ChevronRight, Expand, Images } from 'lucide-svelte';

  export let images: string[] = [];
  export let title = 'Gallery';

  let lightboxIndex: number | null = null;
  let showAll = false;

  $: visibleImages = showAll ? images : images.slice(0, 8);

  function open(i: number) {
    lightboxIndex = i;
  }
  function close() {
    lightboxIndex = null;
  }
  function next() {
    if (lightboxIndex === null) return;
    lightboxIndex = (lightboxIndex + 1) % images.length;
  }
  function prev() {
    if (lightboxIndex === null) return;
    lightboxIndex = (lightboxIndex - 1 + images.length) % images.length;
  }
  function onKeydown(e: KeyboardEvent) {
    if (lightboxIndex === null) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  }
</script>

<svelte:window on:keydown={onKeydown} />

{#if images.length}
  <div>
    <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
          <Images size={15} aria-hidden="true" /> Project catalogue
        </p>
        <h2 class="font-serif text-2xl font-bold text-white">{title}</h2>
      </div>
      <p class="text-sm text-slate-400">{images.length} {images.length === 1 ? 'image' : 'images'}</p>
    </div>

    <div class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {#each visibleImages as img, i}
        <button
          type="button"
          class="group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/5 bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-emerald-500"
          on:click={() => open(i)}
          aria-label="Open {title} image {i + 1} of {images.length}"
        >
          <img src={img} alt="{title} photo {i + 1}" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
          <div class="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100 group-focus:bg-black/30 group-focus:opacity-100">
            <Expand size={18} class="text-white" />
          </div>
        </button>
      {/each}
    </div>

    {#if images.length > 8}
      <div class="mt-6 flex justify-center">
        <button
          type="button"
          class="min-h-[44px] rounded-full border border-white/15 bg-white/[0.04] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:border-emerald-400/50 hover:bg-emerald-400/10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          on:click={() => (showAll = !showAll)}
        >
          {showAll ? 'Show fewer images' : `View all ${images.length} images`}
        </button>
      </div>
    {/if}
  </div>

  {#if lightboxIndex !== null}
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      on:click={close}
      on:keydown={(e) => e.key === 'Escape' && close()}
      role="dialog"
      aria-modal="true"
      aria-label="{title} image viewer"
      tabindex="-1"
    >
      <button type="button" class="absolute right-5 top-5 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-white/10 text-white hover:bg-white/20" on:click={close} aria-label="Close">
        <X size={22} />
      </button>
      <button
        type="button"
        class="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-6"
        on:click|stopPropagation={prev}
        aria-label="Previous image"
      >
        <ChevronLeft size={24} />
      </button>
      <div on:click|stopPropagation role="presentation">
        <img
          src={images[lightboxIndex]}
          alt="{title} enlarged photo {lightboxIndex + 1}"
          class="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
        />
        <p class="mt-3 text-center text-sm text-white/70">
          {lightboxIndex + 1} of {images.length}
        </p>
      </div>
      <button
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-6"
        on:click|stopPropagation={next}
        aria-label="Next image"
      >
        <ChevronRight size={24} />
      </button>
    </div>
  {/if}
{/if}
