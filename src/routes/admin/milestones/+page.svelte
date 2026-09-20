<script lang="ts">
  import { Construction, Loader2, Percent } from "lucide-svelte";
  import { formatRelative } from "$lib/utils/format";

  interface MilestoneRow {
    _id: string;
    title: string;
    description?: string;
    percentComplete: number;
    phase?: string;
    publishedAt: number;
  }

  export let data: { milestones?: MilestoneRow[] } = {};

  const milestones: MilestoneRow[] = data.milestones ?? [];
</script>

<svelte:head><title>Construction Milestones — ADK Admin</title></svelte:head>

<div class="p-8">
  <div class="mb-6">
    <h1 class="flex items-center gap-2 text-xl font-bold text-white"><Construction class="h-5 w-5 text-amber-400" /> Construction Milestones</h1>
    <p class="mt-0.5 text-sm text-stone-500">Progress broadcasts shown to investors on each project page.</p>
  </div>

  <div class="rounded-2xl" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
    {#if milestones.length === 0}
      <p class="py-16 text-center text-sm text-stone-500">
        No milestones published yet. Once a deployment is connected, milestones created via <code class="text-emerald-500">api.projects</code> will appear here for publishing.
      </p>
    {:else}
      <div class="divide-y" style="border-color: rgba(255,255,255,0.04)">
        {#each milestones as m (m._id)}
          <div class="px-6 py-4">
            <div class="mb-2 flex items-center justify-between">
              <p class="font-medium text-white">{m.title}</p>
              <span class="inline-flex items-center gap-1 text-sm font-bold text-emerald-400"><Percent size={13} /> {m.percentComplete}%</span>
            </div>
            <div class="mb-2 h-1.5 overflow-hidden rounded-full bg-white/5">
              <div class="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" style="width: {m.percentComplete}%"></div>
            </div>
            <p class="text-xs text-stone-600">{m.phase ?? 'Phase —'} · published {formatRelative(new Date(m.publishedAt))}</p>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
