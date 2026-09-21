<script lang="ts">
  import { useQuery, runMutation } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { FolderOpen, Loader2, MapPin, Plus, Search, X, Power, PowerOff } from "lucide-svelte";

  const projects = useQuery(api.projects.listProjects, { limit: 100 });
  let search = "";

  $: filtered = ($projects ?? []).filter((p: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) || p.state.toLowerCase().includes(q);
  });

  // ── New Project modal ──────────────────────────────────────────────────
  let showCreateModal = false;
  let creating = false;
  let createError = "";

  let form = {
    name: "",
    location: "",
    lga: "",
    state: "",
    description: "",
    amenities: "",
    infrastructure: ""
  };

  function slugify(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function resetForm() {
    form = { name: "", location: "", lga: "", state: "", description: "", amenities: "", infrastructure: "" };
    createError = "";
  }

  function openCreateModal() {
    resetForm();
    showCreateModal = true;
  }

  async function submitCreate() {
    createError = "";
    if (!form.name.trim() || !form.location.trim() || !form.lga.trim() || !form.state.trim() || !form.description.trim()) {
      createError = "Name, location, LGA, state and description are required.";
      return;
    }
    creating = true;
    try {
      await runMutation(api.projects.createProject, {
        name: form.name.trim(),
        slug: slugify(form.name),
        location: form.location.trim(),
        lga: form.lga.trim(),
        state: form.state.trim(),
        description: form.description.trim(),
        amenities: form.amenities.split(",").map((a) => a.trim()).filter(Boolean),
        infrastructure: form.infrastructure.split(",").map((a) => a.trim()).filter(Boolean)
      } as any);
      showCreateModal = false;
    } catch (err) {
      createError = (err as Error).message ?? "Failed to create project. Please try again.";
    } finally {
      creating = false;
    }
  }

  // ── Activate / deactivate ───────────────────────────────────────────────
  let togglingId: string | null = null;

  async function toggleActive(projectId: string, nextActive: boolean) {
    togglingId = projectId;
    try {
      await runMutation(api.projects.updateProject, { projectId, isActive: nextActive } as any);
    } catch (err) {
      console.error("[admin/projects] toggle failed", err);
      alert((err as Error).message ?? "Failed to update project. Please try again.");
    } finally {
      togglingId = null;
    }
  }
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
      <button
        type="button"
        on:click={openCreateModal}
        class="inline-flex min-h-[44px] flex-shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
      >
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
          <div class="mb-3 flex items-start justify-between gap-2">
            <div class="min-w-0">
              <h2 class="truncate font-bold text-white">{p.name}</h2>
              <p class="flex items-center gap-1 text-xs text-stone-500"><MapPin size={11} /> {p.location}, {p.state}</p>
            </div>
            <button
              type="button"
              disabled={togglingId === p._id}
              on:click={() => toggleActive(p._id, !p.isActive)}
              title={p.isActive ? "Deactivate project" : "Activate project"}
              class="flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors disabled:opacity-50 {p.isActive
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                : 'bg-stone-500/15 text-stone-400 border border-stone-500/30 hover:bg-stone-500/25'}"
            >
              {#if togglingId === p._id}
                <Loader2 size={10} class="animate-spin" />
              {:else if p.isActive}
                <Power size={10} />
              {:else}
                <PowerOff size={10} />
              {/if}
              {p.isActive ? 'ACTIVE' : 'INACTIVE'}
            </button>
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

{#if showCreateModal}
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
    <div
      class="absolute inset-0 bg-black/70 backdrop-blur-sm"
      role="presentation"
      on:click={() => (showCreateModal = false)}
    ></div>
    <div class="relative flex w-full max-w-lg max-h-[90vh] flex-col overflow-y-auto rounded-t-2xl sm:rounded-2xl p-6" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.1)">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-bold text-white">New Project</h2>
        <button type="button" aria-label="Close" on:click={() => (showCreateModal = false)} class="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-stone-400 hover:bg-white/10 hover:text-white">
          <X size={18} />
        </button>
      </div>

      {#if createError}
        <p class="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{createError}</p>
      {/if}

      <div class="space-y-4">
        <label class="block">
          <span class="mb-1 block text-xs text-stone-400">Project / Estate Name *</span>
          <input type="text" bind:value={form.name} placeholder="e.g. Diamond Gardens Estate" class="w-full min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
        </label>
        <label class="block">
          <span class="mb-1 block text-xs text-stone-400">Location *</span>
          <input type="text" bind:value={form.location} placeholder="e.g. Guzape District" class="w-full min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="mb-1 block text-xs text-stone-400">LGA *</span>
            <input type="text" bind:value={form.lga} placeholder="e.g. AMAC" class="w-full min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs text-stone-400">State *</span>
            <input type="text" bind:value={form.state} placeholder="e.g. FCT" class="w-full min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
          </label>
        </div>
        <label class="block">
          <span class="mb-1 block text-xs text-stone-400">Description *</span>
          <textarea bind:value={form.description} rows="3" placeholder="Short description shown to clients" class="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"></textarea>
        </label>
        <label class="block">
          <span class="mb-1 block text-xs text-stone-400">Amenities (comma-separated)</span>
          <input type="text" bind:value={form.amenities} placeholder="Perimeter fencing, Estate security, Tarred roads" class="w-full min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
        </label>
        <label class="block">
          <span class="mb-1 block text-xs text-stone-400">Infrastructure (comma-separated)</span>
          <input type="text" bind:value={form.infrastructure} placeholder="Drainage, Street lighting, Water reticulation" class="w-full min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
        </label>
      </div>

      <div class="mt-6 flex items-center justify-end gap-3">
        <button type="button" on:click={() => (showCreateModal = false)} class="min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium text-stone-400 hover:text-white">Cancel</button>
        <button
          type="button"
          disabled={creating}
          on:click={submitCreate}
          class="flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {#if creating}<Loader2 size={15} class="animate-spin" />{/if} Create Project
        </button>
      </div>
    </div>
  </div>
{/if}
