<script lang="ts">
  // src/lib/components/SEO.svelte
  // Universal <svelte:head> component. Every route renders exactly one of
  // these with a fully-resolved PageSEO object built server-side by
  // buildMeta() (src/lib/seo.ts) inside a load() function — this component
  // itself does no data fetching or merging, only rendering, so its output
  // is guaranteed to be present in the initial SSR HTML response.
  //
  // Svelte 5 runes ($props()) per the project's AEO/GEO spec — this is a new,
  // isolated component so mixing with the rest of the codebase's legacy
  // `export let` components is safe (Svelte 5 supports both per-component).
  import type { PageSEO } from '$lib/types/seo';

  interface Props {
    seo: PageSEO;
  }

  const { seo }: Props = $props();
</script>

<svelte:head>
  <title>{seo.title}</title>
  <meta name="description" content={seo.description} />
  <link rel="canonical" href={seo.canonical} />
  <meta name="robots" content={seo.robots} />

  {#if seo.alternates}
    {#each Object.entries(seo.alternates) as [locale, url] (locale)}
      <link rel="alternate" hreflang={locale} href={url} />
    {/each}
  {/if}

  <!-- Open Graph -->
  <meta property="og:title" content={seo.openGraph.title} />
  <meta property="og:description" content={seo.openGraph.description} />
  <meta property="og:image" content={seo.openGraph.image} />
  {#if seo.openGraph.imageAlt}
    <meta property="og:image:alt" content={seo.openGraph.imageAlt} />
  {/if}
  <meta property="og:url" content={seo.openGraph.url} />
  <meta property="og:type" content={seo.openGraph.type} />
  <meta property="og:locale" content={seo.openGraph.locale} />
  <meta property="og:site_name" content={seo.openGraph.siteName} />

  <!-- Twitter / X -->
  <meta name="twitter:card" content={seo.twitter.card} />
  <meta name="twitter:title" content={seo.twitter.title} />
  <meta name="twitter:description" content={seo.twitter.description} />
  <meta name="twitter:image" content={seo.twitter.image} />
  {#if seo.twitter.imageAlt}
    <meta name="twitter:image:alt" content={seo.twitter.imageAlt} />
  {/if}
  {#if seo.twitter.site}
    <meta name="twitter:site" content={seo.twitter.site} />
  {/if}
  {#if seo.twitter.creator}
    <meta name="twitter:creator" content={seo.twitter.creator} />
  {/if}

  {#if seo.datePublished}
    <meta property="article:published_time" content={seo.datePublished} />
  {/if}
  {#if seo.dateModified}
    <meta property="article:modified_time" content={seo.dateModified} />
  {/if}

  <!-- JSON-LD: pre-serialized server-side by buildPageGraph() (src/lib/schema/graph.ts).
       {@html} is safe here only because graph.ts escapes "<" before this ever
       runs — never interpolate raw JSON.stringify() output into {@html} otherwise. -->
  {#if seo.jsonLd}
    {@html `<script type="application/ld+json">${seo.jsonLd}<\/script>`}
  {/if}
</svelte:head>
