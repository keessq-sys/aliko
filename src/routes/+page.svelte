<script lang="ts">
  import HeroSection from '$lib/components/home/HeroSection.svelte';
  import StatsStrip from '$lib/components/home/StatsStrip.svelte';
  import SignatureDevelopments from '$lib/components/home/SignatureDevelopments.svelte';
  import FeaturedProperties from '$lib/components/home/FeaturedProperties.svelte';
  import PropertyTypes from '$lib/components/home/PropertyTypes.svelte';
  import ExploreLocations from '$lib/components/home/ExploreLocations.svelte';
  import HowItWorks from '$lib/components/home/HowItWorks.svelte';
  import AgentShowcase from '$lib/components/home/AgentShowcase.svelte';
  import MapPreview from '$lib/components/home/MapPreview.svelte';
  import VisionBanner from '$lib/components/home/VisionBanner.svelte';
  import TestimonialsSection from '$lib/components/home/TestimonialsSection.svelte';
  import ServicesSection from '$lib/components/home/ServicesSection.svelte';
  import TrustBanner from '$lib/components/home/TrustBanner.svelte';
  import ROICalculator from '$lib/components/home/ROICalculator.svelte';
  import FAQSection from '$lib/components/home/FAQSection.svelte';
  import DualCTABanner from '$lib/components/home/DualCTABanner.svelte';
  import WhatsAppFloatButton from '$lib/components/ui/WhatsAppFloatButton.svelte';
  import SEO from '$lib/components/SEO.svelte';

  export let data: import('./$types').PageData;
</script>

<SEO seo={data.seo} />

<main class="bg-[#050A0E] min-h-screen text-white selection:bg-emerald-500/30">
  <!-- Answer-first TL;DR: a direct, self-contained answer to "what is Aliko
       Diamond Key" above the fold, ahead of the animated hero, so an AI
       crawler or reader gets the core claim in the first paragraph of HTML. -->
  <p class="sr-only">
    Aliko Diamond Key Realtors Ltd is a government-verified real estate, land and
    property-services marketplace operating in Abuja FCT and Lagos, Nigeria. Every
    listing is title-checked against CAC, AGIS and State Ministry of Lands records
    before publication, and clients can bundle a purchase with interior design,
    construction, smart-home installation or facility management from the same platform.
  </p>
  <HeroSection />
  <StatsStrip />
  <SignatureDevelopments />
  <FeaturedProperties />
  <PropertyTypes />
  <ExploreLocations />
  <HowItWorks />
  <AgentShowcase />
  <MapPreview />
  <VisionBanner />
  <TestimonialsSection />
  <ServicesSection />
  <TrustBanner />
  <ROICalculator />
  <FAQSection />
  <DualCTABanner />
  <WhatsAppFloatButton message="Hi, I'd like to know more about properties and services on Aliko Diamond Key." />
</main>
