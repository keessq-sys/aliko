<script lang="ts">
  import { useQuery, runMutation } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { Layers, Power, PowerOff, DatabaseZap, Loader2 } from "lucide-svelte";
  import { formatNaira } from "$lib/utils/format";
  import { SERVICES, SERVICE_CATEGORY_META } from "$lib/types/services";

  const catalog = useQuery(api.services.listServices, { activeOnly: false });

  // Once the catalog has been seeded (non-empty), the live database rows are
  // the source of truth and their toggle is live; until then, show the
  // static fallback catalog (read-only — nothing to toggle, there's no row
  // to patch yet).
  $: rows = $catalog && $catalog.length > 0
    ? $catalog.map((s: any) => ({
        slug: s.slug,
        name: s.name,
        category: s.category as string,
        price: s.startingPrice ?? null,
        priceUnit: s.priceUnit ?? null,
        isActive: s.isActive,
        isLocal: false,
        id: s._id as string
      }))
    : SERVICES.map((s) => ({
        slug: s.slug,
        name: s.name,
        category: s.category as string,
        price: s.startingPrice ?? null,
        priceUnit: s.priceUnit ?? null,
        isActive: true,
        isLocal: true,
        id: null as string | null
      }));

  let togglingId: string | null = null;

  async function toggle(row: (typeof rows)[number]) {
    if (row.isLocal || !row.id) return;
    togglingId = row.id;
    try {
      await runMutation(api.services.setServiceActive, { id: row.id, isActive: !row.isActive } as any);
    } catch (err) {
      console.error("[admin/services] toggle failed", err);
      alert((err as Error).message ?? "Failed to update service. Please try again.");
    } finally {
      togglingId = null;
    }
  }

  let seeding = false;
  let seedError = "";
  let seedDone = false;

  async function seedCatalog() {
    seeding = true;
    seedError = "";
    try {
      for (let i = 0; i < SERVICES.length; i++) {
        const s = SERVICES[i];
        await runMutation(api.services.upsertService, {
          slug: s.slug,
          name: s.name,
          tagline: s.tagline,
          description: s.tagline,
          category: s.category as any,
          heroImage: s.image,
          features: s.features,
          startingPrice: s.startingPrice,
          priceUnit: s.priceUnit,
          isActive: true,
          isFeatured: i < 4,
          sortOrder: i,
        });
      }
      seedDone = true;
    } catch (err: any) {
      seedError = err?.message ?? "Seeding failed.";
    } finally {
      seeding = false;
    }
  }
</script>

<svelte:head><title>Services Catalog — ADK Admin</title></svelte:head>

<div class="p-8">
  <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="flex items-center gap-2 text-xl font-bold text-white"><Layers class="h-5 w-5 text-emerald-400" /> Services Catalog</h1>
      <p class="mt-0.5 text-sm text-stone-500">Manage the enterprise service divisions offered across the platform.</p>
    </div>
    {#if $catalog && $catalog.length === 0}
      <button
        on:click={seedCatalog}
        disabled={seeding}
        class="flex-shrink-0 inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
      >
        {#if seeding}<Loader2 size={15} class="animate-spin" />{:else}<DatabaseZap size={15} />{/if}
        {seeding ? 'Seeding…' : `Seed ${SERVICES.length} services to database`}
      </button>
    {/if}
  </div>

  {#if seedError}
    <p class="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{seedError}</p>
  {/if}
  {#if seedDone}
    <p class="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">Catalog seeded — reload to see live database entries.</p>
  {/if}

  {#if $catalog === undefined}
    <p class="text-sm text-stone-500">Loading catalog from database… (static fallback shown below once resolved)</p>
  {/if}

  <div class="overflow-hidden rounded-2xl" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
    <div class="overflow-x-auto">
    <table class="w-full text-left text-sm">
      <thead class="bg-white/5 text-stone-400">
        <tr>
          <th class="px-6 py-4">Service</th>
          <th class="px-6 py-4">Category</th>
          <th class="px-6 py-4">Starting Price</th>
          <th class="px-6 py-4">Status</th>
          <th class="px-6 py-4 text-right">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5">
        {#each rows as row (row.slug)}
          <tr class="hover:bg-white/5">
            <td class="px-6 py-4">
              <p class="font-medium text-white">{row.name}</p>
              <p class="font-mono text-xs text-stone-600">{row.slug}</p>
            </td>
            <td class="px-6 py-4 text-stone-300">{SERVICE_CATEGORY_META[row.category]?.label ?? row.category}</td>
            <td class="px-6 py-4 text-white">{row.price ? formatNaira(row.price) : 'Custom'} <span class="text-xs text-stone-600">{row.priceUnit ?? ''}</span></td>
            <td class="px-6 py-4">
              <span class="rounded-full px-2.5 py-1 text-xs font-semibold {row.isActive ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-stone-500/15 text-stone-400 border border-stone-500/30'}">
                {row.isActive ? 'Active' : 'Disabled'}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <button
                on:click={() => toggle(row)}
                class="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-stone-300 transition-colors hover:bg-white/10 disabled:opacity-50"
                disabled={row.isLocal || togglingId === row.id}
                title={row.isLocal ? 'Not yet in the database — seed the catalog to manage this service' : 'Toggle active status'}
              >
                {#if togglingId === row.id}
                  <Loader2 size={13} class="animate-spin" />
                {:else if row.isActive}
                  <Power size={13} class="text-emerald-400" />
                {:else}
                  <PowerOff size={13} class="text-stone-500" />
                {/if}
                {row.isActive ? 'Active' : 'Enable'}
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    </div>
  </div>

  {#if $catalog && $catalog.length > 0}
    <p class="mt-4 text-xs text-stone-600">{$catalog.length} catalog entries loaded from the database.</p>
  {:else}
    <p class="mt-4 text-xs text-stone-600">Database catalog is empty — entries above come from the seeded static catalog and will sync once <code class="text-emerald-500">convex/services.ts upsertService</code> is run for each slug.</p>
  {/if}
</div>
