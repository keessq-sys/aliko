<script lang="ts">
  import { useQuery } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { FileText, Loader2, Search } from "lucide-svelte";
  import { formatRelative } from "$lib/utils/format";

  const documents = useQuery(api.legalDocuments.getPendingDocuments, {});

  const STATUS_CLASSES: Record<string, string> = {
    DRAFT: "text-stone-400",
    PENDING_SIGNATURE: "text-amber-400",
    SIGNED: "text-blue-300",
    VERIFIED: "text-emerald-400",
    REJECTED: "text-rose-400",
    EXPIRED: "text-stone-500",
  };

  let statusFilter = "";
  let search = "";

  $: statusCounts = ($documents ?? []).reduce((acc: Record<string, number>, d: any) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {});

  $: filtered = ($documents ?? []).filter((d: any) => {
    if (statusFilter && d.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return d.referenceCode.toLowerCase().includes(q) || (d.client?.name ?? "").toLowerCase().includes(q);
  });

  const STATUS_FILTERS = ["", "DRAFT", "PENDING_SIGNATURE", "SIGNED", "VERIFIED", "REJECTED"] as const;
</script>

<svelte:head><title>Legal Documents — ADK Admin</title></svelte:head>

<div class="p-8">
  <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div>
      <h1 class="flex items-center gap-2 text-xl font-bold text-white"><FileText class="h-5 w-5 text-amber-400" /> Legal Documents</h1>
      <p class="mt-0.5 text-sm text-stone-500">Deeds, offer letters, tenancy agreements and signature pipeline.</p>
    </div>
    <div class="relative">
      <Search class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-500" />
      <input type="text" bind:value={search} placeholder="Search reference or client…" class="w-64 rounded-xl border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-xs text-white placeholder-stone-600 outline-none focus:border-emerald-500" />
    </div>
  </div>

  <!-- Stat strip -->
  <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
    <div class="rounded-xl px-4 py-3" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06)">
      <p class="text-xl font-black text-white">{$documents?.length ?? '—'}</p>
      <p class="text-xs text-stone-500">Awaiting Action</p>
    </div>
    <div class="rounded-xl px-4 py-3" style="background: rgba(217,119,6,0.08); border: 1px solid rgba(217,119,6,0.2)">
      <p class="text-xl font-black text-amber-400">{statusCounts.PENDING_SIGNATURE ?? 0}</p>
      <p class="text-xs text-stone-500">Awaiting Signature</p>
    </div>
    <div class="rounded-xl px-4 py-3" style="background: rgba(37,99,235,0.08); border: 1px solid rgba(37,99,235,0.2)">
      <p class="text-xl font-black text-blue-300">{statusCounts.SIGNED ?? 0}</p>
      <p class="text-xs text-stone-500">Signed, Unverified</p>
    </div>
    <div class="rounded-xl px-4 py-3" style="background: rgba(5,150,105,0.08); border: 1px solid rgba(5,150,105,0.2)">
      <p class="text-xl font-black text-emerald-400">{statusCounts.VERIFIED ?? 0}</p>
      <p class="text-xs text-stone-500">Verified</p>
    </div>
  </div>

  <!-- Status filter pills -->
  <div class="mb-6 flex flex-wrap gap-2">
    {#each STATUS_FILTERS as s}
      <button
        on:click={() => (statusFilter = s)}
        class="rounded-full px-3.5 py-1.5 text-xs font-medium transition-all {statusFilter === s
          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          : 'bg-white/5 text-stone-400 border border-white/10 hover:text-white'}"
      >
        {s ? s.replace(/_/g, ' ') : 'All'}
      </button>
    {/each}
  </div>

  <div class="overflow-hidden rounded-2xl" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
    {#if $documents === undefined}
      <div class="flex items-center justify-center py-16 text-stone-500"><Loader2 class="h-6 w-6 animate-spin" /></div>
    {:else if filtered.length === 0}
      <p class="py-16 text-center text-sm text-stone-600">{$documents.length === 0 ? "All documents are current — nothing awaiting action." : "No documents match this view."}</p>
    {:else}
      <div class="divide-y" style="border-color: rgba(255,255,255,0.04)">
        {#each filtered as doc (doc._id)}
          <div class="flex items-center gap-4 px-6 py-4">
            <div class="rounded-lg bg-amber-500/10 p-2.5 text-amber-400"><FileText size={16} /></div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-white">{doc.type.replace(/_/g, " ")}</p>
              <p class="font-mono text-xs text-stone-600">{doc.referenceCode} · {doc.client?.name ?? '—'}</p>
            </div>
            <span class="text-xs font-semibold {STATUS_CLASSES[doc.status] ?? 'text-stone-400'}">{doc.status.replace(/_/g, " ")}</span>
            <span class="hidden text-xs text-stone-600 sm:block">{formatRelative(new Date(doc.createdAt))}</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
