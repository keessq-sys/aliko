<script lang="ts">
  import { useQuery, runMutation } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { Building2, Loader2, MapPin, Plus, Search, X, DatabaseZap, Power, PowerOff } from "lucide-svelte";
  import { formatNaira } from "$lib/utils/format";

  const properties = useQuery(api.properties.listProperties, { activeOnly: false, limit: 200 });
  let search = "";

  $: filtered = ($properties ?? []).filter((p: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) || p.state.toLowerCase().includes(q);
  });

  // ── Seed the 12-listing mock catalog into the real database ─────────────
  // Same idiom as admin/services' "Seed catalog" button: the site previously
  // rendered these 12 properties from a hardcoded src/lib/stores/properties.ts
  // array with zero backend. This moves the exact same content into the real
  // `properties` table (upsert by slug, safe to run more than once) so admins
  // can then manage it for real instead of editing frontend source to change
  // a listing.
  const SEED: any[] = [
    { slug: 'emerald-luxury-duplex', title: 'Emerald Luxury Duplex', type: 'DUPLEX', price: 150000000, bedrooms: 5, bathrooms: 6, parkingSpots: 3, sizeSqm: 600, yearBuilt: 2023, location: '15 Diamond Avenue, Lekki Phase 1', state: 'Lagos', isFeatured: true, amenities: ['Pool', 'Gym', 'CCTV', 'Gateman', 'Solar', 'Smart Home'], images: ['https://picsum.photos/seed/adk-p1a/800/600', 'https://picsum.photos/seed/adk-p1b/800/600', 'https://picsum.photos/seed/adk-p1c/800/600'], description: 'A stunning 5-bedroom luxury duplex featuring modern architecture, premium finishes and breathtaking views in the heart of Lekki Phase 1 with state-of-the-art security and smart home features.' },
    { slug: 'victoria-island-penthouse', title: 'Victoria Island Penthouse', type: 'PENTHOUSE', price: 450000000, bedrooms: 4, bathrooms: 4, parkingSpots: 2, sizeSqm: 400, yearBuilt: 2024, location: 'Skyline Towers, Adeola Odeku, Victoria Island', state: 'Lagos', isFeatured: true, amenities: ['Private Pool', 'Gym', 'Concierge', 'CCTV', 'Smart Home'], images: ['https://picsum.photos/seed/adk-p2a/800/600', 'https://picsum.photos/seed/adk-p2b/800/600'], description: 'Exclusive penthouse offering panoramic views of the ocean and city skyline, finished with premium Italian marble, automated systems and a private infinity pool.' },
    { slug: 'maitama-executive-villa', title: 'Maitama Executive Villa', type: 'RESIDENTIAL', price: 850000000, bedrooms: 6, bathrooms: 7, parkingSpots: 6, sizeSqm: 1100, yearBuilt: 2022, location: '8 Aso Drive, Maitama', state: 'FCT Abuja', isFeatured: true, amenities: ['Pool', 'Cinema', 'Gym', 'BQ', 'Generator', 'Smart Home'], images: ['https://picsum.photos/seed/adk-p3a/800/600', 'https://picsum.photos/seed/adk-p3b/800/600'], description: 'A stately six-bedroom villa on Aso Drive with cinema room, guest BQ and landscaped grounds — the definitive Maitama address for diplomats and executives.' },
    { slug: 'wuse-2-smart-apartment', title: 'Wuse 2 Smart Apartment', type: 'APARTMENT', price: 75000000, bedrooms: 3, bathrooms: 3, parkingSpots: 1, sizeSqm: 220, yearBuilt: 2024, location: 'Aminu Kano Crescent, Wuse 2', state: 'FCT Abuja', isFeatured: true, amenities: ['Gym', '24h Power', 'CCTV', 'Elevator'], images: ['https://picsum.photos/seed/adk-p4a/800/600'], description: "Centrally positioned in Abuja's lifestyle epicentre with 24/7 backup power, full smart-home automation and high rental yields." },
    { slug: 'asokoro-sky-penthouse', title: 'Asokoro Sky Penthouse', type: 'PENTHOUSE', price: 550000000, bedrooms: 4, bathrooms: 5, parkingSpots: 3, sizeSqm: 520, yearBuilt: 2023, location: 'Yakubu Gowon Crescent, Asokoro', state: 'FCT Abuja', isFeatured: false, amenities: ['Private Lift', 'Terrace', 'CCTV', 'Concierge'], images: ['https://picsum.photos/seed/adk-p5a/800/600'], description: "Double-height living spaces, private lift lobby and sweeping views over Asokoro's tree-lined avenues." },
    { slug: 'ikoyi-terraced-duplex', title: 'Ikoyi Terraced Duplex', type: 'DUPLEX', price: 320000000, bedrooms: 4, bathrooms: 5, parkingSpots: 2, sizeSqm: 380, yearBuilt: 2021, location: 'Bourdillon Road, Ikoyi', state: 'Lagos', isFeatured: false, amenities: ['Pool', 'Gym', 'Estate Security', 'BQ'], images: ['https://picsum.photos/seed/adk-p6a/800/600'], description: 'Elegant family terraced duplex on Bourdillon with estate pool, gym and round-the-clock security.' },
    { slug: 'lekki-commercial-plaza', title: 'Lekki Commercial Plaza', type: 'COMMERCIAL', price: 680000000, bedrooms: 0, bathrooms: 8, parkingSpots: 30, sizeSqm: 1600, yearBuilt: 2020, location: 'Admiralty Way, Lekki Phase 1', state: 'Lagos', isFeatured: true, amenities: ['Standby Generators', 'Central A/C', 'Parking Deck', 'CCTV'], images: ['https://picsum.photos/seed/adk-p7a/800/600'], description: 'Grade-A office and retail plaza on Admiralty Way with 30-car parking deck, fully fitted floors and strong tenant covenants.' },
    { slug: 'katampe-extension-plot', title: 'Katampe Extension Plot', type: 'LAND', price: 45000000, bedrooms: 0, bathrooms: 0, parkingSpots: 0, sizeSqm: 648, yearBuilt: undefined, location: 'Katampe Extension', state: 'FCT Abuja', isFeatured: false, amenities: ['C of O', 'Fenced Estate', 'Tarred Roads'], images: ['https://picsum.photos/seed/adk-p8a/800/600'], description: 'Fully serviced 648sqm plot in a fenced Katampe Extension estate with C of O, tarred roads and drainage.' },
    { slug: 'guzape-hillside-duplex', title: 'Guzape Hillside Duplex', type: 'DUPLEX', price: 260000000, bedrooms: 5, bathrooms: 5, parkingSpots: 3, sizeSqm: 450, yearBuilt: 2024, location: 'Guzape District', state: 'FCT Abuja', isFeatured: false, amenities: ['City Views', 'Solar', 'CCTV', 'BQ'], images: ['https://picsum.photos/seed/adk-p9a/800/600'], description: 'Contemporary hillside duplex with panoramic city views, solar hybrid power and premium finishes throughout.' },
    { slug: 'ikeja-gra-classic-bungalow', title: 'Ikeja GRA Classic Bungalow', type: 'RESIDENTIAL', price: 120000000, bedrooms: 4, bathrooms: 4, parkingSpots: 4, sizeSqm: 520, yearBuilt: 2018, location: 'Opebi Road, Ikeja GRA', state: 'Lagos', isFeatured: false, amenities: ['Garden', 'Borehole', 'Generator', 'CCTV'], images: ['https://picsum.photos/seed/adk-p10a/800/600'], description: 'Timeless Ikeja GRA bungalow on a quarter-acre of manicured gardens — minutes from the airport and Alausa.' },
    { slug: 'epe-riverside-plots', title: 'Epe Riverside Plots', type: 'LAND', price: 8500000, bedrooms: 0, bathrooms: 0, parkingSpots: 0, sizeSqm: 600, yearBuilt: undefined, location: 'Epe–Ijebu Ode Road, Epe', state: 'Lagos', isFeatured: true, amenities: ['Deed of Assignment', 'Layout Approval', 'Instalments'], images: ['https://picsum.photos/seed/adk-p11a/800/600'], description: "High-growth riverside plots with instant deed of assignment and 12-month instalment plans — Epe corridor is Lagos' fastest-appreciating frontier." },
    { slug: 'port-harcourt-towers-office', title: 'Port Harcourt Towers Office', type: 'COMMERCIAL', price: 210000000, bedrooms: 0, bathrooms: 6, parkingSpots: 14, sizeSqm: 740, yearBuilt: 2019, location: 'Aba Road, Port Harcourt', state: 'Rivers', isFeatured: false, amenities: ['Backup Power', 'Fibre Ready', 'CCTV', 'Parking'], images: ['https://picsum.photos/seed/adk-p12a/800/600'], description: 'Fibre-ready corporate floors on Aba Road with dedicated backup power and secure parking in the heart of the Garden City.' }
  ];

  let seeding = false;
  let seedError = "";
  let seedDone = false;

  async function seedCatalog() {
    seeding = true;
    seedError = "";
    try {
      for (const p of SEED) {
        await runMutation(api.properties.upsertProperty, p as any);
      }
      seedDone = true;
    } catch (err) {
      seedError = (err as Error).message ?? "Seeding failed.";
    } finally {
      seeding = false;
    }
  }

  // ── New Property modal ────────────────────────────────────────────────
  let showCreateModal = false;
  let creating = false;
  let createError = "";
  let form = {
    title: "", type: "RESIDENTIAL", price: "", location: "", state: "",
    bedrooms: "", bathrooms: "", parkingSpots: "", sizeSqm: "",
    description: "", amenities: "", images: ""
  };

  function slugify(name: string): string {
    return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function resetForm() {
    form = { title: "", type: "RESIDENTIAL", price: "", location: "", state: "", bedrooms: "", bathrooms: "", parkingSpots: "", sizeSqm: "", description: "", amenities: "", images: "" };
    createError = "";
  }

  function openCreateModal() {
    resetForm();
    showCreateModal = true;
  }

  async function submitCreate() {
    createError = "";
    if (!form.title.trim() || !form.price || !form.location.trim() || !form.state.trim() || !form.description.trim() || !form.images.trim()) {
      createError = "Title, price, location, state, description and at least one image URL are required.";
      return;
    }
    creating = true;
    try {
      await runMutation(api.properties.createProperty, {
        slug: slugify(form.title),
        title: form.title.trim(),
        type: form.type,
        price: Number(form.price),
        location: form.location.trim(),
        state: form.state.trim(),
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
        parkingSpots: form.parkingSpots ? Number(form.parkingSpots) : undefined,
        sizeSqm: form.sizeSqm ? Number(form.sizeSqm) : undefined,
        description: form.description.trim(),
        amenities: form.amenities.split(",").map((a) => a.trim()).filter(Boolean),
        images: form.images.split(",").map((a) => a.trim()).filter(Boolean)
      } as any);
      showCreateModal = false;
    } catch (err) {
      createError = (err as Error).message ?? "Failed to create property.";
    } finally {
      creating = false;
    }
  }

  let togglingId: string | null = null;

  async function toggleActive(propertyId: string, nextActive: boolean) {
    togglingId = propertyId;
    try {
      await runMutation(api.properties.updateProperty, { propertyId, isActive: nextActive } as any);
    } catch (err) {
      alert((err as Error).message ?? "Failed to update property.");
    } finally {
      togglingId = null;
    }
  }
</script>

<svelte:head><title>Properties — ADK Admin</title></svelte:head>

<div class="p-8">
  <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div>
      <h1 class="flex items-center gap-2 text-xl font-bold text-white"><Building2 class="h-5 w-5 text-emerald-400" /> Properties</h1>
      <p class="mt-0.5 text-sm text-stone-500">Built-unit listings — houses, apartments, duplexes, penthouses and commercial units.</p>
    </div>
    <div class="flex flex-wrap items-center gap-3">
      {#if $properties && $properties.length === 0}
        <button
          on:click={seedCatalog}
          disabled={seeding}
          class="inline-flex min-h-[44px] flex-shrink-0 items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
        >
          {#if seeding}<Loader2 size={15} class="animate-spin" />{:else}<DatabaseZap size={15} />{/if}
          {seeding ? 'Seeding…' : `Seed ${SEED.length} sample listings`}
        </button>
      {/if}
      <div class="relative">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-500" />
        <input type="text" bind:value={search} placeholder="Search title or location…" class="w-56 rounded-xl border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-xs text-white placeholder-stone-600 outline-none focus:border-emerald-500" />
      </div>
      <button type="button" on:click={openCreateModal} class="inline-flex min-h-[44px] flex-shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500">
        <Plus size={15} /> New Property
      </button>
    </div>
  </div>

  {#if seedError}
    <p class="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{seedError}</p>
  {/if}
  {#if seedDone}
    <p class="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">Catalog seeded.</p>
  {/if}

  {#if $properties === undefined}
    <div class="flex items-center justify-center rounded-2xl py-16" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
      <Loader2 class="h-6 w-6 animate-spin text-stone-500" />
    </div>
  {:else if filtered.length === 0}
    <div class="rounded-2xl py-16 text-center" style="background:#0A1628; border: 1px dashed rgba(255,255,255,0.12)">
      <p class="text-sm text-stone-500">{$properties.length === 0 ? "No properties yet — seed the sample catalog or add one manually." : "No properties match your search."}</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {#each filtered as p (p._id)}
        <div class="rounded-2xl p-5" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
          <div class="mb-3 flex items-start justify-between gap-2">
            <div class="min-w-0">
              <h2 class="truncate font-bold text-white">{p.title}</h2>
              <p class="flex items-center gap-1 text-xs text-stone-500"><MapPin size={11} /> {p.location}, {p.state}</p>
            </div>
            <button
              type="button"
              disabled={togglingId === p._id}
              on:click={() => toggleActive(p._id, !p.isActive)}
              class="flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors disabled:opacity-50 {p.isActive
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                : 'bg-stone-500/15 text-stone-400 border border-stone-500/30 hover:bg-stone-500/25'}"
            >
              {#if togglingId === p._id}<Loader2 size={10} class="animate-spin" />{:else if p.isActive}<Power size={10} />{:else}<PowerOff size={10} />{/if}
              {p.isActive ? 'ACTIVE' : 'INACTIVE'}
            </button>
          </div>
          <p class="mb-3 text-lg font-bold text-amber-400">{formatNaira(p.price)}</p>
          <div class="flex flex-wrap gap-2 border-t border-white/5 pt-3 text-xs text-stone-400">
            <span class="rounded-full bg-white/5 px-2 py-1">{p.type}</span>
            <span class="rounded-full bg-white/5 px-2 py-1">{p.status}</span>
            {#if p.bedrooms}<span class="rounded-full bg-white/5 px-2 py-1">{p.bedrooms} bed</span>{/if}
            {#if p.sizeSqm}<span class="rounded-full bg-white/5 px-2 py-1">{p.sizeSqm} sqm</span>{/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if showCreateModal}
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" role="presentation" on:click={() => (showCreateModal = false)}></div>
    <div class="relative flex w-full max-w-lg max-h-[90vh] flex-col overflow-y-auto rounded-t-2xl sm:rounded-2xl p-6" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.1)">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-bold text-white">New Property</h2>
        <button type="button" aria-label="Close" on:click={() => (showCreateModal = false)} class="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-stone-400 hover:bg-white/10 hover:text-white"><X size={18} /></button>
      </div>

      {#if createError}
        <p class="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{createError}</p>
      {/if}

      <div class="space-y-4">
        <label class="block">
          <span class="mb-1 block text-xs text-stone-400">Title *</span>
          <input type="text" bind:value={form.title} placeholder="e.g. Emerald Luxury Duplex" class="w-full min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="mb-1 block text-xs text-stone-400">Type</span>
            <select bind:value={form.type} class="w-full min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500">
              <option value="RESIDENTIAL">Residential</option>
              <option value="APARTMENT">Apartment</option>
              <option value="DUPLEX">Duplex</option>
              <option value="PENTHOUSE">Penthouse</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="LAND">Land</option>
            </select>
          </label>
          <label class="block">
            <span class="mb-1 block text-xs text-stone-400">Price (NGN) *</span>
            <input type="number" inputmode="numeric" bind:value={form.price} placeholder="150000000" class="w-full min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
          </label>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="mb-1 block text-xs text-stone-400">Location *</span>
            <input type="text" bind:value={form.location} placeholder="e.g. Lekki Phase 1" class="w-full min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs text-stone-400">State *</span>
            <input type="text" bind:value={form.state} placeholder="e.g. Lagos" class="w-full min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
          </label>
        </div>
        <div class="grid grid-cols-4 gap-3">
          <label class="block">
            <span class="mb-1 block text-xs text-stone-400">Beds</span>
            <input type="number" inputmode="numeric" bind:value={form.bedrooms} class="w-full min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white outline-none focus:border-emerald-500" />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs text-stone-400">Baths</span>
            <input type="number" inputmode="numeric" bind:value={form.bathrooms} class="w-full min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white outline-none focus:border-emerald-500" />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs text-stone-400">Parking</span>
            <input type="number" inputmode="numeric" bind:value={form.parkingSpots} class="w-full min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white outline-none focus:border-emerald-500" />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs text-stone-400">Sqm</span>
            <input type="number" inputmode="numeric" bind:value={form.sizeSqm} class="w-full min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white outline-none focus:border-emerald-500" />
          </label>
        </div>
        <label class="block">
          <span class="mb-1 block text-xs text-stone-400">Description *</span>
          <textarea bind:value={form.description} rows="3" class="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"></textarea>
        </label>
        <label class="block">
          <span class="mb-1 block text-xs text-stone-400">Amenities (comma-separated)</span>
          <input type="text" bind:value={form.amenities} placeholder="Pool, Gym, CCTV" class="w-full min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
        </label>
        <label class="block">
          <span class="mb-1 block text-xs text-stone-400">Image URLs (comma-separated) *</span>
          <input type="text" bind:value={form.images} placeholder="https://…" class="w-full min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
        </label>
      </div>

      <div class="mt-6 flex items-center justify-end gap-3">
        <button type="button" on:click={() => (showCreateModal = false)} class="min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium text-stone-400 hover:text-white">Cancel</button>
        <button type="button" disabled={creating} on:click={submitCreate} class="flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
          {#if creating}<Loader2 size={15} class="animate-spin" />{/if} Create Property
        </button>
      </div>
    </div>
  </div>
{/if}
