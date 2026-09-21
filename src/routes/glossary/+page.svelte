<script lang="ts">
  import SEO from '$lib/components/SEO.svelte';
  import TLDRBlock from '$lib/components/TLDRBlock.svelte';

  export let data: import('./$types').PageData;
</script>

<SEO seo={data.seo} />

<div class="min-h-screen bg-[#050A0E] pb-24 pt-16 text-white">
  <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
    <header class="mb-8">
      <p class="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Glossary</p>
      <h1 class="font-serif text-3xl font-bold sm:text-4xl">Real Estate & Land-Title Glossary</h1>
    </header>

    <TLDRBlock
      text="This glossary defines the Nigerian land-title and real-estate terms referenced across Aliko Diamond Key's verification process — from Certificate of Occupancy to Governor's Consent."
    />

    <dl class="space-y-4">
      {#each data.terms as term (term.slug)}
        <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <dt>
            <a href={`/glossary/${term.slug}`} class="text-lg font-semibold text-white hover:text-emerald-400">
              {term.term}
            </a>
          </dt>
          <dd class="mt-1.5 text-sm leading-relaxed text-stone-400">{term.shortDefinition}</dd>
        </div>
      {/each}
    </dl>
  </div>
</div>
