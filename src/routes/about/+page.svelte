<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();

  import SEO from '$lib/components/SEO.svelte';
  import PageTemplate from '$lib/components/PageTemplate.svelte';

  export let data: import('./$types').PageData;
</script>

<SEO seo={data.seo} />

<PageTemplate
  eyebrow="About Us"
  title={$adkT("About Aliko Diamond Key")}
  tldr="Aliko Diamond Key Realtors Ltd is a government-verified real estate, land and property-services marketplace based in Abuja FCT with operations in Lagos, led by CEO Ali Ahmed Ali Abubakar. Every listing passes a documented title-verification process before publication."
  author={data.author}
  dateModified={data.dateModified}
  related={[
    { href: '/faq', label: 'Frequently Asked Questions', description: 'How title verification, payments and diaspora buying work.' },
    { href: '/glossary', label: 'Real Estate Glossary', description: 'Definitions of C of O, Governor’s Consent and more.' },
    { href: '/agents', label: 'Verified Agent Network', description: 'How agents and estate managers get verified.' }
  ]}
>
  <section>
    <h2 id="mission" class="mb-3 text-xl font-bold text-white">{$adkT("What is Aliko Diamond Key's mission?")}</h2>
    <blockquote class="border-l-2 border-emerald-500 pl-4 text-lg italic text-stone-200"> {$adkT("\"To make buying verified land and property in Nigeria — and everything that comes after, from interior design to facility management — as safe and straightforward for a diaspora client in London as it is for a buyer in Abuja.\"")} </blockquote>
    <p class="mt-3">{$adkT("— Ali Ahmed Ali Abubakar, CEO, Aliko Diamond Key Realtors Ltd")}</p>
  </section>

  <section>
    <h2 id="verification" class="mb-3 text-xl font-bold text-white">{$adkT("How does the title-verification process work?")}</h2>
    <p> {$adkT("Before any plot or property is published, Aliko Diamond Key cross-checks it against CAC company records, AGIS land registry data for Federal Capital Territory listings, and the relevant State Ministry of Lands. Title documents — Certificate of Occupancy, Governor's Consent, and Deed of Assignment — are then verified by an in-house legal team ahead of any booking.")} </p>
    <p class="mt-3"> {$adkT("See the")} <a href="/glossary" class="text-emerald-400 hover:underline">{$adkT("glossary")}</a> {$adkT("for plain-language definitions of each of these documents.")} </p>
  </section>

  <section>
    <h2 id="what-we-do" class="mb-3 text-xl font-bold text-white">{$adkT("What does Aliko Diamond Key do beyond brokerage?")}</h2>
    <p> {$adkT("Alongside verified property and land sales, Aliko Diamond Key runs an in-house property-services division: interior design and decoration, building-materials and Turkish-tiles supply, smart-home installation, construction and renovation, architectural design and space planning, and property development and facility management. Any of these can be bundled into a single quote alongside a purchase.")} </p>
  </section>

  <section>
    <h2 id="where-we-operate" class="mb-3 text-xl font-bold text-white">{$adkT("Where does Aliko Diamond Key operate?")}</h2>
    <dl class="grid gap-3 sm:grid-cols-2">
      <div class="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <dt class="text-sm font-semibold text-emerald-400">{$adkT("Registered base")}</dt>
        <dd class="mt-1 text-sm text-stone-300">{$adkT("Abuja, Federal Capital Territory, Nigeria")}</dd>
      </div>
      <div class="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <dt class="text-sm font-semibold text-emerald-400">{$adkT("Also serving")}</dt>
        <dd class="mt-1 text-sm text-stone-300">{$adkT("Lagos, Nigeria — with a diaspora-friendly remote process for clients anywhere in the world")}</dd>
      </div>
    </dl>
  </section>
</PageTemplate>
