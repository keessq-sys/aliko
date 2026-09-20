<script lang="ts">
  import { page } from '$app/stores';
  import { serviceBySlug } from '$lib/types/services';
  import ServiceRequestForm from '$lib/components/services/ServiceRequestForm.svelte';
  import { ArrowLeft } from 'lucide-svelte';

  $: slug = $page.url.searchParams.get('service') ?? '';
  $: service = serviceBySlug(slug);
</script>

<div class="min-h-screen bg-[#050A0E] pt-28 pb-20 text-white">
  <div class="mx-auto max-w-3xl px-4">
    <a href={service ? `/services/${service.slug}` : '/services'} class="mb-6 inline-flex items-center gap-1.5 text-xs text-stone-400 transition-colors hover:text-emerald-400">
      <ArrowLeft size={14} /> Back to {service ? service.name : 'Services'}
    </a>

    {#if service}
      <h1 class="mb-2 font-serif text-3xl font-bold">{service.requestTypeLabel}</h1>
      <p class="mb-8 text-stone-400">{service.tagline}</p>
      <ServiceRequestForm
        serviceSlug={service.slug}
        serviceLabel={service.requestTypeLabel}
        requestType={service.requestType}
      />
    {:else}
      <h1 class="mb-2 font-serif text-3xl font-bold">Submit a Request</h1>
      <p class="mb-8 text-stone-400">Choose a service to continue, or use the links below.</p>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {#each ['interior-design', 'decoration-styling', 'furnishing', 'turkish-tiles-supply', 'building-materials-supply', 'smart-home-installation', 'construction-services', 'general-contracts'] as s}
          <a href="/request?service={s}" class="glass rounded-xl p-4 text-sm font-medium text-white transition-colors hover:border-emerald-500/40">
            {serviceBySlug(s)?.requestTypeLabel ?? s}
          </a>
        {/each}
      </div>
    {/if}
  </div>
</div>
