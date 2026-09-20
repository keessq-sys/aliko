<script lang="ts" context="module">
  import { error } from '@sveltejs/kit';
  export function load({ params }: { params: { slug: string } }) {
    // Validate slug against the static catalog at build/runtime.
    return { params };
  }
</script>

<script lang="ts">
  import { CheckCircle2, Clock, MapPin, ShieldCheck, ArrowLeft } from 'lucide-svelte';
  import { page } from '$app/stores';
  import { SERVICES, SERVICE_CATEGORY_META, serviceBySlug } from '$lib/types/services';
  import { formatNaira } from '$lib/utils/format';
  import ServiceRequestForm from '$lib/components/services/ServiceRequestForm.svelte';
  import ImageGallery from '$lib/components/services/ImageGallery.svelte';

  export let data: { params?: { slug?: string } } = {};

  // `data.params` is not always populated during SSR component init; the
  // `$page` store always carries the route params, so use it as fallback.
  $: slug = data?.params?.slug ?? $page.params?.slug ?? '';
  $: service = serviceBySlug(slug);
  $: related = service
    ? SERVICES.filter((s) => s.slug !== service.slug && s.category === service.category).slice(0, 3)
    : [];
</script>

<svelte:head>
  <title>{service ? `${service.name} Services` : 'Services'} — Aliko Diamond Key</title>
  <meta name="description" content={service?.tagline ?? 'Aliko Diamond Key enterprise services'} />
</svelte:head>

{#if service}
  {@const Icon = service.icon}
  <div class="min-h-screen bg-[#050A0E] text-white">
    <!-- Hero -->
    <section class="relative h-[46vh] min-h-[380px] overflow-hidden">
      <img src={service.image} alt={service.name} class="absolute inset-0 h-full w-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-t from-[#050A0E] via-[#050A0E]/60 to-transparent"></div>
      <div class="absolute inset-x-0 bottom-0">
        <div class="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <a href="/services" class="mb-4 inline-flex items-center gap-1.5 text-xs text-stone-400 transition-colors hover:text-emerald-400">
            <ArrowLeft size={14} /> All Services
          </a>
          <div class="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-black/50 px-3 py-1 text-[11px] font-semibold text-emerald-300 backdrop-blur-md">
            {SERVICE_CATEGORY_META[service.category].label}
          </div>
          <h1 class="font-serif text-4xl font-bold sm:text-5xl">{service.name}</h1>
          <p class="mt-2 max-w-2xl text-stone-300">{service.tagline}</p>
        </div>
      </div>
    </section>

    <!-- Body -->
    <section class="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <div class="grid gap-10 lg:grid-cols-3">
        <!-- Left: info -->
        <div class="space-y-6 lg:col-span-2">
          <div class="rounded-2xl border border-white/5 bg-white/[0.03] p-6">
            <h2 class="mb-4 font-serif text-2xl font-bold text-white">What We Deliver</h2>
            <ul class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {#each service.features as feature}
                <li class="flex items-start gap-2 text-sm text-stone-300">
                  <CheckCircle2 size={16} class="mt-0.5 flex-shrink-0 text-emerald-400" />
                  {feature}
                </li>
              {/each}
            </ul>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div class="glass rounded-xl p-4">
              <ShieldCheck size={18} class="mb-2 text-emerald-400" />
              <p class="text-xs text-stone-400">Quality guaranteed with verified suppliers & licensed crews</p>
            </div>
            <div class="glass rounded-xl p-4">
              <Clock size={18} class="mb-2 text-amber-400" />
              <p class="text-xs text-stone-400">48-hour admin response on every submitted request</p>
            </div>
            <div class="glass rounded-xl p-4">
              <MapPin size={18} class="mb-2 text-blue-400" />
              <p class="text-xs text-stone-400">Nationwide delivery & site coverage across Nigeria</p>
            </div>
          </div>

          {#if service.gallery?.length}
            <ImageGallery images={service.gallery} title="{service.name} Gallery" />
          {/if}

          {#if related.length}
            <div>
              <h3 class="mb-4 font-serif text-xl font-bold text-white">Related Services</h3>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {#each related as r}
                  <a href="/services/{r.slug}" class="group overflow-hidden rounded-xl border border-white/5 bg-white/[0.03] transition-colors hover:border-emerald-500/40">
                    <div class="h-24 overflow-hidden">
                      <img src={r.image} alt={r.name} class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <p class="p-3 text-sm font-medium text-white">{r.name}</p>
                  </a>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <!-- Right: request form -->
        <div class="lg:col-span-1">
          <div class="sticky top-24">
            <h2 class="mb-4 font-serif text-2xl font-bold text-white">Request This Service</h2>
            {#if service.startingPrice}
              <p class="mb-4 text-sm text-stone-400">
                Starting from <span class="font-bold text-amber-400">{formatNaira(service.startingPrice)}</span>
                <span class="text-stone-600"> {service.priceUnit}</span>
              </p>
            {/if}
          </div>
        </div>
      </div>

      <!-- Full-width form below -->
      <div class="mt-10 border-t border-white/5 pt-10">
        <ServiceRequestForm
          serviceSlug={service.slug}
          serviceLabel={service.requestTypeLabel}
          requestType={service.requestType}
        />
      </div>
    </section>
  </div>
{:else}
  <div class="flex min-h-[60vh] flex-col items-center justify-center bg-[#050A0E] text-center text-white">
    <h1 class="mb-2 font-serif text-3xl font-bold">Service not found</h1>
    <p class="mb-6 text-stone-400">The service you're looking for doesn't exist.</p>
    <a href="/services" class="btn-primary px-6 py-3">Browse All Services</a>
  </div>
{/if}
