<script lang="ts">
  import { Plus, Minus } from 'lucide-svelte';
  import { reveal } from '$lib/actions/reveal';
  import { FAQS } from '$lib/data/faq';

  let openIndex: number | null = 0;

  function toggle(i: number) {
    openIndex = openIndex === i ? null : i;
  }
</script>

<section id="faq" class="border-t border-white/5 bg-[#050A0E] py-20 text-white" use:reveal>
  <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
    <div class="mb-10 text-center">
      <p class="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">FAQ</p>
      <h2 class="font-serif text-3xl font-bold sm:text-4xl">Frequently Asked Questions</h2>
    </div>

    <div class="space-y-3">
      {#each FAQS as item, i (item.id)}
        <div id={item.id} class="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] scroll-mt-24">
          <button
            type="button"
            on:click={() => toggle(i)}
            class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            aria-expanded={openIndex === i}
          >
            <span class="text-sm font-semibold text-white sm:text-base">{item.q}</span>
            <span class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/5 text-emerald-400">
              {#if openIndex === i}<Minus size={14} />{:else}<Plus size={14} />{/if}
            </span>
          </button>
          {#if openIndex === i}
            <div class="px-5 pb-5">
              <p class="text-sm leading-relaxed text-stone-400">{item.a}</p>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</section>
