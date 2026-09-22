<script lang="ts">
  import { MapPin, Maximize2, Bed, TrendingUp, Check, Heart, ArrowRight } from "lucide-svelte";
  import { formatNaira } from "$lib/utils/format";

  export let plot: {
    _id: string;
    beaconNumber: string;
    sizeSqm: number;
    price: number;
    status: string;
    titleVerified: boolean;
    isCornerPlot: boolean;
    isPrimeLocation: boolean;
    isFeatured: boolean;
    projectedGrowthPct?: number;
    tags?: string[];
    titleType: string;
    project?: {
      name: string;
      location: string;
      lga: string;
      state: string;
    } | null;
    heroImageUrl?: string | null;
  };

  let liked = false;

  const STATUS_STYLES: Record<string, string> = {
    AVAILABLE:         "badge-available",
    RESERVED:          "badge-reserved",
    SOLD:              "badge-sold",
    UNDER_DEVELOPMENT: "badge-pending",
    OFF_PLAN:          "badge-pending",
  };

  const TITLE_LABELS: Record<string, string> = {
    C_OF_O:              "C of O",
    GOVERNORS_CONSENT:   "Governor's Consent",
    DEED_OF_ASSIGNMENT:  "Deed of Assignment",
    R_OF_O:              "R of O",
    STATUTORY_OFFER:     "Statutory Offer",
  };

  $: badges = [
    plot.titleVerified && TITLE_LABELS[plot.titleType],
    plot.isCornerPlot && "Corner Plot",
    plot.isPrimeLocation && "Prime Location",
    ...(plot.tags?.slice(0, 1) ?? []),
  ].filter(Boolean) as string[];

  $: statusClass = STATUS_STYLES[plot.status] ?? "badge-pending";
  $: isAvailable = plot.status === "AVAILABLE";
  $: growth = plot.projectedGrowthPct ?? 0;

  const BG_GRADIENTS = [
    "from-emerald-950 to-slate-900",
    "from-slate-800 to-emerald-950",
    "from-indigo-950 to-slate-900",
    "from-slate-900 to-teal-950",
  ];
  const bgIdx = parseInt(plot._id.slice(-1), 16) % BG_GRADIENTS.length;
</script>

<a href="/properties/{plot._id}" class="block group">
  <article class="card-luxury overflow-hidden">
    <!-- Image / placeholder -->
    <div class="relative h-52 overflow-hidden bg-gradient-to-br {BG_GRADIENTS[bgIdx]} flex items-center justify-center">
      {#if plot.heroImageUrl}
        <img src={plot.heroImageUrl} alt="Beacon {plot.beaconNumber}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
      {:else}
        <svg class="w-16 h-16 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
          <path d="M3 21h18M3 7l9-4 9 4M4 11h16v10H4z"/>
          <path d="M9 21V12h6v9"/>
        </svg>
        <!-- Shimmer overlay -->
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
               style="background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%); animation: shimmer 2s linear infinite;"></div>
        </div>
      {/if}

      <!-- Status badge -->
      <span class="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full {statusClass}">
        {isAvailable ? "● Available" : plot.status.replace("_", " ")}
      </span>

      <!-- Growth badge -->
      {#if growth > 0}
        <span class="absolute top-3 right-12 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"
              style="background:rgba(217,119,6,0.18);color:#F59E0B;border:1px solid rgba(217,119,6,0.3)">
          <TrendingUp class="w-3 h-3" />{growth}%
        </span>
      {/if}

      <!-- Like -->
      <button
        class="absolute top-3 right-3 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200"
        style="background:rgba(0,0,0,0.45)"
        on:click|preventDefault={() => (liked = !liked)}
        aria-label="Save plot"
        aria-pressed={liked}
      >
        <Heart class="w-4 h-4 transition-colors {liked ? 'fill-rose-500 text-rose-500' : 'text-white/70'}" />
      </button>

      <!-- Featured -->
      {#if plot.isFeatured}
        <span class="absolute bottom-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full"
              style="background:rgba(217,119,6,0.2);color:#FCD34D;border:1px solid rgba(253,211,77,0.3)">
          ★ Featured
        </span>
      {/if}
    </div>

    <!-- Content -->
    <div class="p-4">
      <!-- Verification badges -->
      {#if badges.length > 0}
        <div class="flex flex-wrap gap-1.5 mb-3">
          {#each badges.slice(0, 2) as badge}
            <span class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full badge-verified">
              <Check class="w-2.5 h-2.5" />{badge}
            </span>
          {/each}
        </div>
      {/if}

      <!-- Title -->
      <h3 class="text-white font-semibold text-sm leading-snug mb-1.5 group-hover:text-emerald-300 transition-colors duration-200">
        Beacon {plot.beaconNumber}
        {#if plot.project}<span class="text-stone-500 font-normal"> — {plot.project.name}</span>{/if}
      </h3>

      <!-- Location -->
      {#if plot.project}
        <div class="flex items-center gap-1 text-xs text-stone-500 mb-4">
          <MapPin class="w-3 h-3 flex-shrink-0" />
          <span class="truncate">{plot.project.location}</span>
        </div>
      {/if}

      <!-- Metrics -->
      <div class="flex items-center gap-2 mb-4 flex-wrap">
        <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-stone-300" style="background:rgba(255,255,255,0.04)">
          <Maximize2 class="w-3.5 h-3.5 text-stone-400" />{plot.sizeSqm} sqm
        </div>
        <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs" style="background:rgba(217,119,6,0.08);color:#F59E0B">
          <TrendingUp class="w-3.5 h-3.5" />{formatNaira(plot.price / plot.sizeSqm)}/sqm
        </div>
      </div>

      <!-- Price + CTA -->
      <div class="flex items-center justify-between pt-3 border-t" style="border-top: 1px solid rgba(255,255,255,0.06)">
        <div>
          <p class="text-white font-black text-lg tracking-tight">{formatNaira(plot.price)}</p>
        </div>
        <span class="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all duration-200 {isAvailable ? 'group-hover:scale-105' : 'opacity-60'}"
              style="background:{isAvailable ? 'linear-gradient(135deg,#065f46,#047857)' : '#1f2937'};color:#fff">
          {isAvailable ? "Reserve" : "Details"} <ArrowRight class="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  </article>
</a>
