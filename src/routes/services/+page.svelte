<script lang="ts">
  import { ArrowRight, Lamp, Sparkles, Sofa, Grid3x3, HardHat, Cpu, Building2, FileSignature, CheckCircle2 } from 'lucide-svelte';
  import { SERVICES, SERVICE_CATEGORY_META, servicesWithFallback } from '$lib/types/services';
  import { formatNaira } from '$lib/utils/format';

  const ICONS: Record<string, any> = {
    lamp: Lamp, sparkles: Sparkles, sofa: Sofa, grid: Grid3x3,
    'hard-hat': HardHat, cpu: Cpu, building: Building2, 'file-signature': FileSignature
  };
  const services = servicesWithFallback(undefined);
  const categories = Object.keys(SERVICE_CATEGORY_META);
</script>

<svelte:head>
  <title>Services — Interior Design, Tiles, Smart Homes & Construction | Aliko Diamond Key</title>
  <meta name="description" content="Beyond real estate: interior design, decoration, furnishing, Turkish tiles, building materials, smart home installation, construction and general contracts." />
</svelte:head>

<div class="min-h-screen bg-[#050A0E] text-white">
  <!-- Hero -->
  <section class="relative overflow-hidden border-b border-white/5 py-20">
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-transparent to-transparent"></div>
    <div class="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-amber-600/10 blur-[120px]"></div>
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="max-w-2xl">
        <div class="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-3 py-1 font-mono text-xs text-emerald-400">
          <span class="h-2 w-2 animate-ping rounded-full bg-emerald-400"></span>
          MORE THAN REAL ESTATE
        </div>
        <h1 class="mb-4 font-serif text-4xl font-bold leading-tight sm:text-5xl">
          One Partner for <span class="text-gradient-gold">Property,</span>
          <span class="text-gradient-emerald">Interiors & Construction</span>
        </h1>
        <p class="text-base leading-relaxed text-stone-400">
          Aliko Diamond Key delivers complete building solutions — from concept design and foreign tile supply to smart-home automation, full construction and general contracts. Submit a request and our dedicated desk responds within 48 hours.
        </p>
      </div>
    </div>
  </section>

  <!-- Category chips -->
  <section class="border-b border-white/5 bg-white/[0.02] py-4">
    <div class="mx-auto flex max-w-7xl flex-wrap justify-center gap-2 px-4">
      {#each categories as key}
        <a href="/services?category={key}" class="rounded-full border border-white/10 bg-black/30 px-4 py-1.5 text-xs font-medium text-stone-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300">
          {SERVICE_CATEGORY_META[key].label}
        </a>
      {/each}
    </div>
  </section>

  <!-- Services grid -->
  <section class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
      {#each services as service}
        {@const Icon = ICONS[service.icon] ?? Lamp}
        <div class="card-3d flex flex-col overflow-hidden rounded-2xl bg-white/5">
          <div class="relative h-44 overflow-hidden">
            <img src={service.image} alt={service.name} class="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
            <div class="absolute inset-0 bg-gradient-to-t from-[#050A0E] via-transparent to-transparent"></div>
            <div class="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-emerald-300 backdrop-blur-md">
              {SERVICE_CATEGORY_META[service.category].label}
            </div>
          </div>
          <div class="flex flex-1 flex-col p-5">
            <div class="mb-3 flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Icon size={20} />
              </div>
              <h2 class="font-serif text-lg font-bold text-white">{service.name}</h2>
            </div>
            <p class="mb-4 text-sm text-stone-400">{service.tagline}</p>
            <ul class="mb-4 space-y-1.5">
              {#each service.features.slice(0, 3) as feature}
                <li class="flex items-center gap-2 text-xs text-stone-400">
                  <CheckCircle2 size={13} class="flex-shrink-0 text-emerald-500" />
                  {feature}
                </li>
              {/each}
            </ul>
            <div class="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
              <div class="text-xs text-stone-500">
                {#if service.startingPrice}
                  <span class="block text-[10px] uppercase tracking-wider">From</span>
                  <span class="font-bold text-amber-400">{formatNaira(service.startingPrice)}</span>
                  <span class="text-stone-600"> {service.priceUnit}</span>
                {:else}
                  <span class="text-stone-500">Custom quote</span>
                {/if}
              </div>
              <a href="/services/{service.slug}" class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 transition-colors hover:text-emerald-300">
                Request <ArrowRight size={13} />
              </a>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- Process strip -->
  <section class="border-t border-white/5 bg-white/[0.02] py-16">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2 class="mb-10 text-center font-serif text-3xl font-bold text-white">How a Service Request Works</h2>
      <div class="grid grid-cols-1 gap-8 md:grid-cols-4">
        {#each [
          { n: '01', t: 'Submit Your Brief', d: 'Complete the request form for your chosen service — takes 3 minutes.' },
          { n: '02', t: 'Admin Review', d: 'The super-admin desk reviews scope, location and budget within 48 hours.' },
          { n: '03', t: 'Receive Your Quote', d: 'An official quote with timelines and materials lands in your portal.' },
          { n: '04', t: 'We Deliver', d: 'Approved projects are executed, supervised and reported end-to-end.' }
        ] as step}
          <div class="glass p-6 rounded-2xl">
            <div class="mb-3 font-mono text-4xl font-bold text-emerald-500/30">{step.n}</div>
            <h3 class="mb-2 font-bold text-white">{step.t}</h3>
            <p class="text-xs leading-relaxed text-stone-400">{step.d}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="mx-auto max-w-4xl px-4 py-20 text-center">
    <h2 class="mb-4 font-serif text-3xl font-bold text-white">Ready to build, furnish or automate?</h2>
    <p class="mb-8 text-stone-400">Pick a service above or talk to our team about a bundled property + interior package.</p>
    <div class="flex flex-wrap justify-center gap-4">
      <a href="/services/turkish-tiles-supply" class="btn-secondary px-8 py-3.5 text-sm">Request Turkish Tiles</a>
      <a href="/services/interior-design" class="btn-primary px-8 py-3.5 text-sm">Start an Interior Project</a>
    </div>
  </section>
</div>
