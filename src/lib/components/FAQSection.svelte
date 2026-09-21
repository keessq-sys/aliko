<script lang="ts">
  // src/lib/components/FAQSection.svelte
  // Generic, reusable, accessible FAQ accordion for any content page. Pass
  // the same FaqItem[] you build the FAQPage schema from (see
  // src/lib/data/faq.ts and buildFAQSchema in src/lib/schema/builders.ts) so
  // visible text and structured data never drift apart. Optionally groups by
  // `category` and anchor-links every question by `id` for deep linking —
  // both the homepage's condensed FAQ and the full /faq page can use this.
  import { Plus, Minus } from 'lucide-svelte';
  import { untrack } from 'svelte';
  import type { FaqItem } from '$lib/data/faq';

  interface Props {
    faqs: FaqItem[];
    /** Group visually under category headings. Off by default (homepage-style flat list). */
    grouped?: boolean;
    heading?: string;
  }

  const { faqs, grouped = false, heading = 'Frequently Asked Questions' }: Props = $props();

  // Only the *initial* first question should default open — later prop
  // updates must not reset it, hence untrack() around the read of `faqs`.
  let openId: string | null = $state(untrack(() => faqs[0]?.id ?? null));

  function toggle(id: string) {
    openId = openId === id ? null : id;
  }

  const groups = $derived(
    grouped
      ? faqs.reduce<Record<string, FaqItem[]>>((acc, item) => {
          (acc[item.category] ??= []).push(item);
          return acc;
        }, {})
      : { '': faqs }
  );
</script>

<section aria-label={heading}>
  {#if heading}
    <h2 class="mb-6 font-serif text-2xl font-bold text-white sm:text-3xl">{heading}</h2>
  {/if}

  {#each Object.entries(groups) as [category, items] (category || 'all')}
    <div class="mb-8 last:mb-0">
      {#if grouped && category}
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-[0.15em] text-emerald-400">{category}</h3>
      {/if}
      <div class="space-y-3">
        {#each items as item (item.id)}
          <div id={item.id} class="scroll-mt-24 overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03]">
            <button
              type="button"
              onclick={() => toggle(item.id)}
              class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left min-h-[44px]"
              aria-expanded={openId === item.id}
              aria-controls={`${item.id}-answer`}
            >
              <span class="text-sm font-semibold text-white sm:text-base">{item.q}</span>
              <span class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/5 text-emerald-400">
                {#if openId === item.id}<Minus size={14} />{:else}<Plus size={14} />{/if}
              </span>
            </button>
            {#if openId === item.id}
              <div id={`${item.id}-answer`} class="px-5 pb-5">
                <p class="text-sm leading-relaxed text-stone-400">{item.a}</p>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/each}
</section>
