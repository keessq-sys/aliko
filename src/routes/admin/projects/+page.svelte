<script lang="ts">
  import { useQuery } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { FolderOpen, Loader2, MapPin, Plus, Search } from "lucide-svelte";
  import { formatNaira } from "$lib/utils/format";

  const projects = useQuery(api.projects.listProjects, { limit: 100 });
  let search = "";

  $: filtered = ($projects ?? []).filter((p: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) || p.state.toLowerCase().includes(q);
  });
</script>

<svelte:head><title>Projects & Estates — ADK Admin</title></svelte:head>

<div class="p-8">
  <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div>
      <h1 class="flex items-center gap-2 text-xl font-bold text-white"><FolderOpen class="h-5 w-5 text-emerald-400" /> Projects & Estates</h1>
      <p class="mt-0.5 text-sm text-stone-500">Master list of developments and estates under management.</p>
    </div>
    <div class="flex items-center gap-3">
      <div class="relative">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-500" />
        <input type="text" bind:value={search} placeholder="Search name or location…" class="w-56 rounded-xl border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-xs text-white placeholder-stone-600 outline-none focus:border-emerald-500" />
      </div>
      <button class="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500">
        <Plus size={15} /> New Project
      </button>
    </div>
  </div>

  {#if $projects}
    <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div class="rounded-xl px-4 py-3" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06)">
        <p class="text-xl font-black text-white">{$projects.length}</p>
        <p class="text-xs text-stone-500">Total Projects</p>
      </div>
      <div class="rounded-xl px-4 py-3" style="background: rgba(5,150,105,0.08); border: 1px solid rgba(5,150,105,0.2)">
        <p class="text-xl font-black text-emerald-400">{$projects.filter((p: any) => p.isActive).length}</p>
        <p class="text-xs text-stone-500">Active</p>
      </div>
      <div class="rounded-xl px-4 py-3" style="background: rgba(217,119,6,0.08); border: 1px solid rgba(217,119,6,0.2)">
        <p class="text-xl font-black text-amber-400">{$projects.reduce((s: number, p: any) => s + (p.totalPlots ?? 0), 0)}</p>
        <p class="text-xs text-stone-500">Total Plots</p>
      </div>
      <div class="rounded-xl px-4 py-3" style="background: rgba(37,99,235,0.08); border: 1px solid rgba(37,99,235,0.2)">
        <p class="text-xl font-black text-blue-300">{$projects.reduce((s: number, p: any) => s + (p.availablePlots ?? 0), 0)}</p>
        <p class="text-xs text-stone-500">Available</p>
      </div>
    </div>
  {/if}

  {#if $projects === undefined}
    <div class="flex items-center justify-center rounded-2xl py-16" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
      <Loader2 class="h-6 w-6 animate-spin text-stone-500" />
    </div>
  {:else if filtered.length === 0}
    <div class="rounded-2xl py-16 text-center" style="background:#0A1628; border: 1px dashed rgba(255,255,255,0.12)">
      <p class="text-sm text-stone-500">{$projects.length === 0 ? "No projects yet. Create your first estate to start adding plots." : "No projects match your search."}</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {#each filtered as p (p._id)}
        <div class="rounded-2xl p-5" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
          <div class="mb-3 flex items-start justify-between">
            <div>
              <h2 class="font-bold text-white">{p.name}</h2>
              <p class="flex items-center gap-1 text-xs text-stone-500"><MapPin size={11} /> {p.location}, {p.state}</p>
            </div>
            <span class="rounded-full px-2 py-0.5 text-[10px] font-bold {p.isActive ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-stone-500/15 text-stone-400 border border-stone-500/30'}">
              {p.isActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
          <p class="mb-4 line-clamp-2 text-xs text-stone-400">{p.description}</p>
          <div class="grid grid-cols-3 gap-2 border-t border-white/5 pt-3 text-center">
            <div><p class="font-bold text-white">{p.totalPlots ?? '—'}</p><p class="text-[10px] text-stone-600">PLOTS</p></div>
            <div><p class="font-bold text-emerald-400">{p.availablePlots ?? '—'}</p><p class="text-[10px] text-stone-600">AVAILABLE</p></div>
            <div><p class="font-bold text-amber-400">{p.amenities?.length ?? 0}</p><p class="text-[10px] text-stone-600">AMENITIES</p></div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
