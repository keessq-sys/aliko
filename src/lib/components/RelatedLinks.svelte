<script lang="ts">
  // src/lib/components/RelatedLinks.svelte
  // Internal-linking cluster block: a handful of related pages rendered as a
  // plain, semantic list at the bottom of a content page. This is what turns
  // isolated pages into a "topic cluster" a crawler can traverse — see the
  // cluster map in static/llms-full.txt for which pages should link to which.
  interface LinkItem {
    href: string;
    label: string;
    description?: string;
  }

  interface Props {
    title?: string;
    links: LinkItem[];
  }

  const { title = 'Related pages', links }: Props = $props();
</script>

{#if links.length}
  <nav aria-label={title} class="mt-12 border-t border-white/10 pt-8">
    <h2 class="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">{title}</h2>
    <ul class="grid gap-3 sm:grid-cols-2">
      {#each links as link (link.href)}
        <li>
          <a
            href={link.href}
            class="block rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition-colors hover:border-emerald-500/30 hover:bg-white/[0.06]"
          >
            <span class="block text-sm font-semibold text-white">{link.label}</span>
            {#if link.description}
              <span class="mt-0.5 block text-xs text-stone-400">{link.description}</span>
            {/if}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
{/if}
