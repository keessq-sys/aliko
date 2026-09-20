<script lang="ts">
  import { page } from "$app/stores";
  import { useQuery, runMutation } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { Inbox, Search, Loader2, Send, X, Calendar, MapPin, Building, Phone, Mail, Banknote } from "lucide-svelte";
  import { formatNaira } from "$lib/utils/format";
  import { REQUEST_STATUS_META } from "$lib/types/services";

  const FILTERS = [
    { key: "", label: "All" },
    { key: "NEW", label: "New" },
    { key: "REVIEWING", label: "Reviewing" },
    { key: "QUOTED", label: "Quoted" },
    { key: "ACCEPTED", label: "Accepted" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "COMPLETED", label: "Completed" },
    { key: "REJECTED", label: "Declined" },
  ] as const;

  let statusFilter = "";
  let search = "";
  let selectedId: string | null = null;
  let responseText = "";
  let quoteAmount = "";
  let acting = false;
  let actionError = "";

  const requests = useQuery(api.serviceRequests.listRequests, {
    status: (statusFilter || undefined) as any,
    limit: 200,
  });


  $: filtered = ($requests ?? []).filter((r: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.reference.toLowerCase().includes(q) ||
      r.requesterName.toLowerCase().includes(q) ||
      r.requesterEmail.toLowerCase().includes(q) ||
      r.serviceSlug.toLowerCase().includes(q)
    );
  });

  $: selected = filtered.find((r: any) => r._id === selectedId) ?? filtered[0] ?? null;

  async function updateStatus(status: string, opts?: { response?: string; quote?: number }) {
    if (!selected) return;
    acting = true;
    actionError = "";
    try {
      await runMutation(api.serviceRequests.reviewServiceRequest, {
        id: selected._id as any,
        status: status as any,
        adminResponse: opts?.response ?? (responseText.trim() || undefined),
        quoteAmount: opts?.quote ?? (quoteAmount ? Number(quoteAmount) : undefined),
      });
      responseText = "";
      quoteAmount = "";
    } catch (err: any) {
      actionError = err?.message ?? "Action failed.";
    } finally {
      acting = false;
    }
  }
</script>

<svelte:head><title>Service Requests — ADK Admin</title></svelte:head>

<div class="p-8">
  <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div>
      <h1 class="flex items-center gap-2 text-xl font-bold text-white"><Inbox class="h-5 w-5 text-emerald-400" /> Service Requests Inbox</h1>
      <p class="mt-0.5 text-sm text-stone-500">Supply contracts, purchases, smart homes, interiors, construction & general contracts.</p>
    </div>
    <div class="relative">
      <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
      <input
        type="text"
        bind:value={search}
        placeholder="Search reference, name, email…"
        class="w-72 rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-white placeholder-stone-600 outline-none focus:border-emerald-500"
      />
    </div>
  </div>

  <!-- Status filter pills -->
  <div class="mb-6 flex flex-wrap gap-2">
    {#each FILTERS as f}
      <button
        on:click={() => (statusFilter = f.key)}
        class="rounded-full px-3.5 py-1.5 text-xs font-medium transition-all {statusFilter === f.key
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          : 'bg-white/5 text-stone-400 border border-white/10 hover:text-white'}"
      >
        {f.label}
        {#if f.key === "NEW" && $requests}
          <span class="ml-1 rounded-full bg-rose-500/20 px-1.5 text-[10px] font-bold text-rose-300">
            {($requests as any[]).filter((r: any) => r.status === "NEW").length}
          </span>
        {/if}
      </button>
    {/each}
  </div>

  <div class="grid gap-6 lg:grid-cols-5">
    <!-- List -->
    <div class="lg:col-span-2">
      <div class="overflow-hidden rounded-2xl" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
        {#if $requests === undefined}
          <div class="flex items-center justify-center py-16 text-stone-500"><Loader2 class="h-6 w-6 animate-spin" /></div>
        {:else if filtered.length === 0}
          <p class="py-16 text-center text-sm text-stone-600">No requests match this view.</p>
        {:else}
          <div class="divide-y max-h-[70vh] overflow-y-auto" style="border-color: rgba(255,255,255,0.04)">
            {#each filtered as r (r._id)}
              <button
                on:click={() => (selectedId = r._id)}
                class="w-full px-5 py-4 text-left transition-colors {selected?._id === r._id ? 'bg-emerald-500/10' : 'hover:bg-white/5'}"
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="truncate text-xs font-bold text-white">{r.requesterName}</span>
                  <span class="rounded-full px-2 py-0.5 text-[10px] font-bold {REQUEST_STATUS_META[r.status]?.classes ?? ''}">{REQUEST_STATUS_META[r.status]?.label ?? r.status}</span>
                </div>
                <p class="mt-1 truncate text-xs text-stone-500">{r.requestType.replace(/_/g, ' ')} · {r.serviceSlug}</p>
                <p class="mt-0.5 font-mono text-[10px] text-stone-600">{r.reference}</p>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Detail -->
    <div class="lg:col-span-3">
      {#if !selected}
        <div class="flex h-64 items-center justify-center rounded-2xl text-sm text-stone-600" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
          Select a request to review.
        </div>
      {:else}
        <div class="space-y-5">
          <!-- Detail card -->
          <div class="rounded-2xl p-6" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
            <div class="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 class="text-lg font-bold text-white">{selected.requestType.replace(/_/g, " ")}</h2>
                <p class="font-mono text-xs text-stone-500">{selected.reference}</p>
              </div>
              <span class="rounded-full px-3 py-1 text-xs font-bold {REQUEST_STATUS_META[selected.status]?.classes ?? ''}">
                {REQUEST_STATUS_META[selected.status]?.label ?? selected.status}
              </span>
            </div>

            <div class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div class="flex items-center gap-2 text-stone-300"><Mail class="h-4 w-4 text-stone-600" /> {selected.requesterEmail}</div>
              <div class="flex items-center gap-2 text-stone-300"><Phone class="h-4 w-4 text-stone-600" /> {selected.requesterPhone}</div>
              <div class="flex items-center gap-2 text-stone-300"><Building class="h-4 w-4 text-stone-600" /> {selected.company ?? "—"}</div>
              <div class="flex items-center gap-2 text-stone-300"><MapPin class="h-4 w-4 text-stone-600" /> {selected.location ?? "—"}</div>
              <div class="flex items-center gap-2 text-stone-300"><Banknote class="h-4 w-4 text-stone-600" /> {selected.budgetMin ? `${formatNaira(selected.budgetMin)} – ${selected.budgetMax ? formatNaira(selected.budgetMax) : '+'}` : "Budget not stated"}</div>
              <div class="flex items-center gap-2 text-stone-300"><Calendar class="h-4 w-4 text-stone-600" /> {selected.timeline ?? "—"}</div>
            </div>

            <div class="mt-5 rounded-xl border border-white/5 bg-black/30 p-4">
              <p class="mb-1 text-[10px] font-bold uppercase tracking-wider text-stone-600">Project Brief</p>
              <p class="text-sm leading-relaxed text-stone-300">{selected.projectBrief}</p>
            </div>

            {#if selected.adminResponse}
              <div class="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p class="mb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500">Admin Response{selected.quoteAmount ? ` · Quote ${formatNaira(selected.quoteAmount)}` : ""}</p>
                <p class="text-sm leading-relaxed text-emerald-100">{selected.adminResponse}</p>
              </div>
            {/if}
          </div>

          <!-- Respond form -->
          <div class="rounded-2xl p-6" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
            <h3 class="mb-4 text-sm font-bold text-white">Respond & Move Pipeline</h3>
            {#if actionError}
              <p class="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{actionError}</p>
            {/if}
            <label class="mb-3 block">
              <span class="mb-1 block text-xs text-stone-500">Response to client (visible in their portal)</span>
              <textarea bind:value={responseText} rows="3" class="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" placeholder="e.g. We have reviewed your brief. Quote attached: ₦12,400,000 incl. materials and 6-week delivery."></textarea>
            </label>
            <label class="mb-4 block sm:w-64">
              <span class="mb-1 block text-xs text-stone-500">Quote amount (₦, optional)</span>
              <input type="number" bind:value={quoteAmount} min="0" class="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" placeholder="12400000" />
            </label>

            <div class="flex flex-wrap gap-2">
              {#each ["REVIEWING", "QUOTED", "ACCEPTED", "REJECTED", "IN_PROGRESS", "COMPLETED"] as st}
                <button
                  disabled={acting}
                  on:click={() => updateStatus(st)}
                  class="rounded-lg px-3.5 py-2 text-xs font-semibold transition-all disabled:opacity-50 {st === 'REJECTED'
                    ? 'border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                    : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'}"
                >
                  {#if acting}<Loader2 class="mr-1 inline h-3 w-3 animate-spin" />{/if}
                  {st === 'IN_PROGRESS' ? 'Start Progress' : st.charAt(0) + st.slice(1).toLowerCase().replace('_', ' ')}
                </button>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
