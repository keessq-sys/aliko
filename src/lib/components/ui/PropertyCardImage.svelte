<script lang="ts">
  export let images: string[] = [];
  export let title: string;
  let failed: string[] = [];
  function markFailed(source: string) {
    if (!failed.includes(source)) failed = [...failed, source];
  }
  // A cached or fast failure can happen before Svelte attaches event handlers
  // to a server-rendered image. Inspect it when hydration mounts the element.
  function recoverFailedImage(node: HTMLImageElement) {
    if (node.complete && node.naturalWidth === 0) {
      const source = node.getAttribute("src");
      if (source) markFailed(source);
    }
  }
  $: candidates = [...new Set(images.filter((image) => image?.trim()))];
  $: current = candidates.find((image) => !failed.includes(image));
</script>

{#if current}
  {#each [current] as source (source)}
    <img
      use:recoverFailedImage
      src={source}
      alt={title}
      class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
      on:error={() => markFailed(source)}
    />
  {/each}
{:else}
  <div
    class="property-image-unavailable flex h-full items-center justify-center px-6 text-center text-sm"
    role="img"
    aria-label={`${title}: photograph unavailable`}
  >
    Property photographs will be available soon
  </div>
{/if}
