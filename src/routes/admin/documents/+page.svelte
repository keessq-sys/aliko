<script lang="ts">
  import { useQuery } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { FileText, Loader2 } from "lucide-svelte";
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
</script>

<svelte:head><title>Legal Documents — ADK Admin</title></svelte:head>

<div class="p-8">
  <div class="mb-6">
    <h1 class="flex items-center gap-2 text-xl font-bold text-white"><FileText class="h-5 w-5 text-amber-400" /> Legal Documents</h1>
    <p class="mt-0.5 text-sm text-stone-500">Deeds, offer letters, tenancy agreements and signature pipeline.</p>
  </div>

  <div class="overflow-hidden rounded-2xl" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
    {#if $documents === undefined}
      <div class="flex items-center justify-center py-16 text-stone-500"><Loader2 class="h-6 w-6 animate-spin" /></div>
    {:else if $documents.length === 0}
      <p class="py-16 text-center text-sm text-stone-600">All documents are current — nothing awaiting action.</p>
    {:else}
      <div class="divide-y" style="border-color: rgba(255,255,255,0.04)">
        {#each $documents as doc (doc._id)}
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
