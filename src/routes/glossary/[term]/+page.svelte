<script lang="ts">
  import SEO from '$lib/components/SEO.svelte';
  import RelatedLinks from '$lib/components/RelatedLinks.svelte';
  import { GLOSSARY_TERMS } from '$lib/data/glossary';

  export let data: import('./$types').PageData;

  $: otherTerms = GLOSSARY_TERMS.filter((t) => t.slug !== data.term.slug).slice(0, 4);
</script>

<SEO seo={data.seo} />

<div class="min-h-screen bg-[#050A0E] pb-24 pt-16 text-white">
  <div class="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
    <nav aria-label="Breadcrumb" class="mb-6 text-xs text-stone-500">
      <a href="/" class="hover:text-emerald-400">Home</a>
      <span class="mx-1.5">/</span>
      <a href="/glossary" class="hover:text-emerald-400">Glossary</a>
      <span class="mx-1.5">/</span>
      <span class="text-stone-400">{data.term.term}</span>
    </nav>

    <article>
      <h1 class="mb-4 font-serif text-3xl font-bold sm:text-4xl">{data.term.term}</h1>

      <!-- Answer-first, single self-contained paragraph: this is the exact
           text the DefinedTerm JSON-LD's `description` also carries, so the
           visible definition and the structured data can never disagree. -->
      <p class="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5 text-base leading-relaxed text-stone-200 sm:text-lg">
        {data.term.definition}
      </p>

      {#if data.term.sources?.length}
        <section aria-label="Sources" class="mt-8">
          <h2 class="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Sources</h2>
          <ul class="space-y-1">
            {#each data.term.sources as source (source.href)}
              <li class="text-sm text-stone-400">
                <cite class="not-italic"><a href={source.href} class="hover:text-emerald-400">{source.label}</a></cite>
              </li>
            {/each}
          </ul>
        </section>
      {/if}
    </article>

    <RelatedLinks
      title="More terms"
      links={otherTerms.map((t) => ({ href: `/glossary/${t.slug}`, label: t.term, description: t.shortDefinition }))}
    />
  </div>
</div>
