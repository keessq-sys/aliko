<script lang="ts">
  // src/lib/components/AuthorCard.svelte
  // E-E-A-T author block. Renders the Person entity visibly (name, role,
  // photo, bio, profile links) next to whatever content they're accountable
  // for. The matching Person JSON-LD is built separately by
  // buildPersonSchema() (src/lib/schema/builders.ts) inside the page's
  // load() — this component only renders the human-visible half; pass the
  // same AuthorData object to both so they never drift apart.
  import type { AuthorData } from '$lib/schema/types';

  interface Props {
    author: AuthorData;
    /** ISO date string, rendered next to the byline when provided. */
    dateModified?: string;
  }

  const { author, dateModified }: Props = $props();

  const formattedDate = $derived(
    dateModified
      ? new Date(dateModified).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })
      : null
  );
</script>

<div class="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
  {#if author.image}
    <img
      src={author.image}
      alt={author.name}
      width="56"
      height="56"
      class="h-14 w-14 flex-shrink-0 rounded-full object-cover ring-2 ring-emerald-500/30"
      loading="lazy"
    />
  {/if}
  <div class="min-w-0">
    <p class="truncate text-sm font-semibold text-white">
      {#if author.url}
        <a href={author.url} class="hover:text-emerald-400" rel="author">{author.name}</a>
      {:else}
        {author.name}
      {/if}
    </p>
    {#if author.role}
      <p class="truncate text-xs text-stone-400">{author.role}</p>
    {/if}
    {#if formattedDate}
      <p class="mt-1 text-xs text-stone-500">
        Last updated <time datetime={dateModified}>{formattedDate}</time>
      </p>
    {/if}
  </div>
</div>
