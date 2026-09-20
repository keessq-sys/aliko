<script lang="ts">
  import HeroSection from '$lib/components/home/HeroSection.svelte';
  import StatsStrip from '$lib/components/home/StatsStrip.svelte';
  import SignatureDevelopments from '$lib/components/home/SignatureDevelopments.svelte';
  import FeaturedProperties from '$lib/components/home/FeaturedProperties.svelte';
  import PropertyTypes from '$lib/components/home/PropertyTypes.svelte';
  import HowItWorks from '$lib/components/home/HowItWorks.svelte';
  import AgentShowcase from '$lib/components/home/AgentShowcase.svelte';
  import MapPreview from '$lib/components/home/MapPreview.svelte';
  import TestimonialsSection from '$lib/components/home/TestimonialsSection.svelte';
  import ServicesSection from '$lib/components/home/ServicesSection.svelte';
  import TrustBanner from '$lib/components/home/TrustBanner.svelte';
  import ROICalculator from '$lib/components/home/ROICalculator.svelte';
  import DualCTABanner from '$lib/components/home/DualCTABanner.svelte';
</script>

<svelte:head>
  <title>Aliko Diamond Key — Nigeria's Premier Real Estate Platform</title>
  <meta name="description" content="Discover ultra-premium homes, land, and commercial spaces across Nigeria with our government-verified, zero-fraud guarantee." />
</svelte:head>

<main class="bg-[#050A0E] min-h-screen text-white selection:bg-emerald-500/30">
  <HeroSection />
  <StatsStrip />
  <SignatureDevelopments />
  <FeaturedProperties />
  <PropertyTypes />
  <HowItWorks />
  <AgentShowcase />
  <MapPreview />
  <TestimonialsSection />
  <ServicesSection />
  <TrustBanner />
  <ROICalculator />
  <DualCTABanner />
</main>
