<script lang="ts">
  import { ArrowRight, Lamp, Sparkles, Sofa, Grid3x3, HardHat, Cpu, Building2, FileSignature } from 'lucide-svelte';
  import { SERVICES, SERVICE_CATEGORY_META } from '$lib/types/services';

  const ICONS: Record<string, any> = {
    lamp: Lamp, sparkles: Sparkles, sofa: Sofa, grid: Grid3x3,
    'hard-hat': HardHat, cpu: Cpu, building: Building2, 'file-signature': FileSignature
  };
</script>

<section class="relative border-t border-white/5 py-20">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <div class="mb-2 font-mono text-xs uppercase tracking-widest text-amber-400">BEYOND REAL ESTATE</div>
        <h2 class="font-serif text-3xl font-bold text-white sm:text-4xl">Interior, Supply & Construction Divisions</h2>
      </div>
      <a href="/services" class="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 transition-colors hover:text-emerald-300">
        Explore All Services <ArrowRight size={16} />
      </a>
    </div>

    <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
      {#each SERVICES as service}
        {@const Icon = ICONS[service.icon] ?? Lamp}
        <a
          href="/services/{service.slug}"
          class="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-[0_12px_30px_-10px_rgba(5,150,105,0.25)]"
        >
          <div class="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 transition-transform duration-300 group-hover:scale-110">
            <Icon size={22} />
          </div>
          <h3 class="mb-1 text-sm font-bold text-white">{service.name}</h3>
          <p class="mb-4 line-clamp-2 text-[11px] leading-relaxed text-stone-400">{service.tagline}</p>
          <div class="flex items-center justify-between">
            <span class="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
              {SERVICE_CATEGORY_META[service.category].label.split(' ')[0]}
            </span>
            <ArrowRight size={14} class="text-stone-600 transition-all group-hover:translate-x-1 group-hover:text-emerald-400" />
          </div>
        </a>
      {/each}
    </div>

    <!-- Bundled CTA strip -->
    <div class="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-950/30 to-emerald-950/20 p-6 md:flex-row">
      <div>
        <h3 class="font-serif text-lg font-bold text-white">Buy a property, move in fully finished.</h3>
        <p class="text-sm text-stone-400">Bundle purchase with interior design, furnishing and smart-home installation in one contract.</p>
      </div>
      <a href="/request?service=interior-design" class="btn-secondary flex-shrink-0 px-6 py-3 text-sm">Request a Bundle Quote</a>
    </div>
  </div>
</section>
