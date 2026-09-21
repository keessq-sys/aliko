<script lang="ts">
  import SEO from '$lib/components/SEO.svelte';
  import TLDRBlock from '$lib/components/TLDRBlock.svelte';
  import FAQSection from '$lib/components/FAQSection.svelte';
  import RelatedLinks from '$lib/components/RelatedLinks.svelte';

  export let data: import('./$types').PageData;
</script>

<SEO seo={data.seo} />

<div class="min-h-screen bg-[#050A0E] pb-24 pt-16 text-white">
  <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
    <header class="mb-8">
      <p class="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Help Center</p>
      <h1 class="font-serif text-3xl font-bold sm:text-4xl">Frequently Asked Questions</h1>
    </header>

    <TLDRBlock
      text="Aliko Diamond Key verifies every land/property title before listing, supports remote diaspora purchases end-to-end, and offers 6- or 12-month installment plans on most plots and properties."
    />

    <FAQSection faqs={data.faqs} grouped heading="" />

    <RelatedLinks
      title="Related pages"
      links={[
        { href: '/glossary', label: 'Real Estate Glossary', description: 'Plain-language definitions of Nigerian land-title terms.' },
        { href: '/about', label: 'About Aliko Diamond Key', description: 'Our verification methodology and leadership.' },
        { href: '/services', label: 'Property Services', description: 'Interior design, construction, smart-home and more.' },
        { href: '/agents', label: 'Become a Verified Agent', description: 'How the 5-step agent verification process works.' }
      ]}
    />
  </div>
</div>
