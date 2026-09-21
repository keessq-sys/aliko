<script lang="ts">
  // src/lib/components/PageTemplate.svelte
  // Generic optimized content-page shell: eyebrow + H1, TL;DR, an <article>
  // slot for the question-based body, then FAQ / author / related-links /
  // sources in a fixed, answer-first order. Used by /about, /faq and
  // /glossary/[term]; any future content page (docs, guides, blog) can reuse
  // it rather than hand-rolling the same structure.
  import TLDRBlock from './TLDRBlock.svelte';
  import AuthorCard from './AuthorCard.svelte';
  import RelatedLinks from './RelatedLinks.svelte';
  import FAQSection from './FAQSection.svelte';
  import type { AuthorData } from '$lib/schema/types';
  import type { FaqItem } from '$lib/data/faq';
  import type { Snippet } from 'svelte';

  interface RelatedLink {
    href: string;
    label: string;
    description?: string;
  }

  interface Source {
    label: string;
    href: string;
  }

  interface Props {
    eyebrow?: string;
    title: string;
    tldr?: string;
    author?: AuthorData;
    dateModified?: string;
    faqs?: FaqItem[];
    faqGrouped?: boolean;
    related?: RelatedLink[];
    sources?: Source[];
    children: Snippet;
  }

  const {
    eyebrow,
    title,
    tldr,
    author,
    dateModified,
    faqs,
    faqGrouped = false,
    related = [],
    sources = [],
    children
  }: Props = $props();
</script>

<div class="min-h-screen bg-[#050A0E] pb-24 pt-16 text-white">
  <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
    <header class="mb-8">
      {#if eyebrow}
        <p class="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">{eyebrow}</p>
      {/if}
      <h1 class="font-serif text-3xl font-bold sm:text-4xl">{title}</h1>
    </header>

    {#if tldr}
      <TLDRBlock text={tldr} />
    {/if}

    {#if author}
      <div class="mb-8">
        <AuthorCard {author} {dateModified} />
      </div>
    {/if}

    <article class="prose-content space-y-6 text-stone-300">
      {@render children()}
    </article>

    {#if faqs?.length}
      <div class="mt-12">
        <FAQSection {faqs} grouped={faqGrouped} />
      </div>
    {/if}

    {#if sources.length}
      <section aria-label="Sources" class="mt-12 border-t border-white/10 pt-8">
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Sources</h2>
        <ul class="space-y-1.5">
          {#each sources as source (source.href)}
            <li class="text-sm text-stone-400">
              <cite class="not-italic">
                <a href={source.href} class="hover:text-emerald-400" rel="noopener noreferrer">{source.label}</a>
              </cite>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <RelatedLinks links={related} />
  </div>
</div>
