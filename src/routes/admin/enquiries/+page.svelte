<script lang="ts">
  import { useQuery, runMutation } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { MessageSquare, Loader2, Phone, Mail } from "lucide-svelte";
  import { formatRelative } from "$lib/utils/format";

  const enquiries = useQuery(api.enquiries.listEnquiries, {});

  const STATUS_OPTIONS = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"] as const;
  const STATUS_CLASSES: Record<string, string> = {
    NEW: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    CONTACTED: "text-blue-300 bg-blue-500/10 border-blue-500/30",
    QUALIFIED: "text-purple-300 bg-purple-500/10 border-purple-500/30",
    CONVERTED: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    LOST: "text-stone-400 bg-stone-500/10 border-stone-500/30"
  };

  let statusFilter = "";
  $: filtered = ($enquiries ?? []).filter((e: any) => !statusFilter || e.status === statusFilter);

  let updatingId: string | null = null;

  async function updateStatus(enquiryId: string, status: string) {
    updatingId = enquiryId;
    try {
      await runMutation(api.enquiries.updateEnquiryStatus, { enquiryId, status } as any);
    } catch (err) {
      alert((err as Error).message ?? "Failed to update enquiry.");
    } finally {
      updatingId = null;
    }
  }

  function subjectLabel(e: any): string {
    if (e.property) return e.property.title;
    if (e.plot) return e.plot.beaconNumber;
    if (e.project) return e.project.name;
    return "General enquiry";
  }
</script>

<svelte:head><title>Enquiries — ADK Admin</title></svelte:head>

<div class="p-8">
  <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div>
      <h1 class="flex items-center gap-2 text-xl font-bold text-white"><MessageSquare class="h-5 w-5 text-emerald-400" /> Enquiries</h1>
      <p class="mt-0.5 text-sm text-stone-500">Leads submitted from property, plot and project pages.</p>
    </div>
  </div>

  <div class="mb-6 flex flex-wrap gap-2">
    <button
      on:click={() => (statusFilter = "")}
      class="min-h-[44px] rounded-full px-3.5 py-1.5 text-xs font-medium transition-all {statusFilter === ''
        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
        : 'bg-white/5 text-stone-400 border border-white/10 hover:text-white'}"
    >
      All
    </button>
    {#each STATUS_OPTIONS as s}
      <button
        on:click={() => (statusFilter = s)}
        class="min-h-[44px] rounded-full px-3.5 py-1.5 text-xs font-medium transition-all {statusFilter === s
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          : 'bg-white/5 text-stone-400 border border-white/10 hover:text-white'}"
      >
        {s}
      </button>
    {/each}
  </div>

  <div class="overflow-hidden rounded-2xl" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
    {#if $enquiries === undefined}
      <div class="flex items-center justify-center py-16 text-stone-500"><Loader2 class="h-6 w-6 animate-spin" /></div>
    {:else if filtered.length === 0}
      <p class="py-16 text-center text-sm text-stone-600">{$enquiries.length === 0 ? "No enquiries yet." : "No enquiries match this view."}</p>
    {:else}
      <div class="divide-y" style="border-color: rgba(255,255,255,0.04)">
        {#each filtered as e (e._id)}
          <div class="flex flex-wrap items-center gap-4 px-6 py-4">
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-white">{e.name} <span class="text-stone-600">·</span> <span class="text-stone-400">{subjectLabel(e)}</span></p>
              <p class="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                <span class="flex items-center gap-1"><Mail size={11} /> {e.email}</span>
                <span class="flex items-center gap-1"><Phone size={11} /> {e.phone}</span>
              </p>
              {#if e.message}<p class="mt-1 text-xs text-stone-500 line-clamp-1">{e.message}</p>{/if}
            </div>
            <span class="hidden text-xs text-stone-600 sm:block">{formatRelative(new Date(e.createdAt))}</span>
            <select
              value={e.status}
              disabled={updatingId === e._id}
              on:change={(ev) => updateStatus(e._id, (ev.target as HTMLSelectElement).value)}
              class="min-h-[44px] rounded-full border px-2.5 py-1 text-xs font-semibold outline-none disabled:opacity-50 {STATUS_CLASSES[e.status] ?? ''}"
            >
              {#each STATUS_OPTIONS as s}
                <option value={s}>{s}</option>
              {/each}
            </select>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
