<script lang="ts">
  import { X, ChevronLeft, ChevronRight, Expand } from 'lucide-svelte';

  export let images: string[] = [];
  export let title = 'Gallery';

  let lightboxIndex: number | null = null;

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
    <h2 class="mb-4 font-serif text-2xl font-bold text-white">{title}</h2>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {#each images as img, i}
        <button
          type="button"
          class="group relative aspect-square overflow-hidden rounded-xl border border-white/5 bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-emerald-500"
          on:click={() => open(i)}
        >
          <img src={img} alt="{title} photo {i + 1}" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
          <div class="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
            <Expand size={18} class="text-white" />
          </div>
        </button>
      {/each}
    </div>
  </div>

  {#if lightboxIndex !== null}
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      on:click={close}
      role="dialog"
      aria-modal="true"
      aria-label="{title} image viewer"
      tabindex="-1"
    >
      <button type="button" class="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" on:click={close} aria-label="Close">
        <X size={22} />
      </button>
      <button
        type="button"
        class="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-6"
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
      </div>
      <button
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-6"
        on:click|stopPropagation={next}
        aria-label="Next image"
      >
        <ChevronRight size={24} />
      </button>
    </div>
  {/if}
{/if}
