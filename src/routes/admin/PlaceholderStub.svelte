<script lang="ts">
  export let icon: any = null;
  export let title: string;
  export let description: string;
  export let note: string;
</script>

<div class="p-8">
  <div class="mb-6">
    <h1 class="flex items-center gap-2 text-xl font-bold text-white">
      {#if icon}<svelte:component this={icon} class="h-5 w-5 text-emerald-400" />{/if}
      {title}
    </h1>
    <p class="mt-0.5 text-sm text-stone-500">{description}</p>
  </div>

  <div class="flex flex-col items-center justify-center rounded-2xl py-24 text-center"
       style="background:#0A1628; border: 1px dashed rgba(255,255,255,0.12)">
    <p class="mb-2 font-mono text-xs uppercase tracking-widest text-stone-600">Module Ready</p>
    <p class="max-w-md text-sm text-stone-400">{note}</p>
  </div>
</div>
