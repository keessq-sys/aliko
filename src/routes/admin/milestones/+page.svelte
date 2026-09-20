<script lang="ts">
  import { useQuery, runMutation } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { Construction, Loader2, Percent, Plus, X } from "lucide-svelte";
  import { formatRelative } from "$lib/utils/format";

  const milestones = useQuery(api.milestones.listMilestones, {});
  const projects = useQuery(api.projects.listProjects, { limit: 100 });

  let showForm = false;
  let submitting = false;
  let formError = "";
  let form = {
    projectId: "",
    title: "",
    description: "",
    phase: "",
    percentComplete: 0,
  };

  function resetForm() {
    form = { projectId: "", title: "", description: "", phase: "", percentComplete: 0 };
    formError = "";
  }

  async function publish() {
    if (!form.projectId || !form.title.trim()) {
      formError = "Project and title are required.";
      return;
    }
    submitting = true;
    formError = "";
    try {
      await runMutation(api.milestones.createMilestone, {
        projectId: form.projectId as any,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        phase: form.phase.trim() || undefined,
        percentComplete: Number(form.percentComplete),
      });
      resetForm();
      showForm = false;
    } catch (err: any) {
      formError = err?.message ?? "Failed to publish milestone.";
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head><title>Construction Milestones — ADK Admin</title></svelte:head>

<div class="p-8">
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="flex items-center gap-2 text-xl font-bold text-white"><Construction class="h-5 w-5 text-amber-400" /> Construction Milestones</h1>
      <p class="mt-0.5 text-sm text-stone-500">Progress broadcasts shown to investors on each project page.</p>
    </div>
    <button
      on:click={() => (showForm = !showForm)}
      class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
    >
      {#if showForm}<X size={15} /> Cancel{:else}<Plus size={15} /> Publish Milestone{/if}
    </button>
  </div>

  {#if showForm}
    <div class="mb-6 rounded-2xl p-6" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
      {#if formError}
        <p class="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">{formError}</p>
      {/if}
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1 block text-xs text-stone-500">Project</span>
          <select bind:value={form.projectId} class="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500">
            <option value="">Select a project…</option>
            {#each $projects ?? [] as p}
              <option value={p._id}>{p.name}</option>
            {/each}
          </select>
        </label>
        <label class="block">
          <span class="mb-1 block text-xs text-stone-500">Phase</span>
          <input type="text" bind:value={form.phase} placeholder="e.g. Foundation, Roofing" class="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
        </label>
        <label class="block sm:col-span-2">
          <span class="mb-1 block text-xs text-stone-500">Title</span>
          <input type="text" bind:value={form.title} placeholder="e.g. Roofing completed on Block C" class="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
        </label>
        <label class="block sm:col-span-2">
          <span class="mb-1 block text-xs text-stone-500">Description (optional)</span>
          <textarea bind:value={form.description} rows="2" class="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"></textarea>
        </label>
        <label class="block sm:col-span-2">
          <span class="mb-1 block text-xs text-stone-500">Overall completion: {form.percentComplete}%</span>
          <input type="range" min="0" max="100" bind:value={form.percentComplete} class="w-full accent-emerald-500" />
        </label>
      </div>
      <button
        on:click={publish}
        disabled={submitting}
        class="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {#if submitting}<Loader2 size={15} class="animate-spin" />{/if}
        Publish to investors
      </button>
    </div>
  {/if}

  <div class="rounded-2xl" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
    {#if $milestones === undefined}
      <div class="flex items-center justify-center py-16 text-stone-500"><Loader2 class="h-6 w-6 animate-spin" /></div>
    {:else if $milestones.length === 0}
      <p class="py-16 text-center text-sm text-stone-500">No milestones published yet. Use "Publish Milestone" above to broadcast the first update.</p>
    {:else}
      <div class="divide-y" style="border-color: rgba(255,255,255,0.04)">
        {#each $milestones as m (m._id)}
          <div class="px-6 py-4">
            <div class="mb-2 flex items-center justify-between">
              <p class="font-medium text-white">{m.title}</p>
              <span class="inline-flex items-center gap-1 text-sm font-bold text-emerald-400"><Percent size={13} /> {m.percentComplete}%</span>
            </div>
            <div class="mb-2 h-1.5 overflow-hidden rounded-full bg-white/5">
              <div class="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" style="width: {m.percentComplete}%"></div>
            </div>
            {#if m.description}<p class="mb-1 text-xs text-stone-400">{m.description}</p>{/if}
            <p class="text-xs text-stone-600">{m.project?.name ?? 'Unknown project'} · {m.phase ?? 'Phase —'} · published {formatRelative(new Date(m.publishedAt))}</p>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
