<script lang="ts">
  // src/lib/components/TLDRBlock.svelte
  // A styled, visible answer-first intro: a self-contained 1-3 sentence
  // answer to "what is this page about", rendered before any other content.
  // This is the block an AI answer engine is most likely to lift verbatim,
  // so its text must stand alone without the surrounding page for context.
  interface Props {
    /** Plain text, 1-3 sentences. No markup — this must be citation-clean. */
    text: string;
    label?: string;
  }

  const { text, label = 'In short' }: Props = $props();
</script>

<aside
  class="mb-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-5 py-4 sm:px-6 sm:py-5"
  aria-label="Summary"
>
  <p class="mb-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">{label}</p>
  <p class="text-base leading-relaxed text-stone-200 sm:text-lg">{text}</p>
</aside>
