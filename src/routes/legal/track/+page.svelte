<script lang="ts">
  import { useQuery } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { Shield, FileText, CheckCircle, Clock, AlertCircle, Download, Search } from "lucide-svelte";
  import { formatDateTime } from "$lib/utils/format";

  let refInput = ($page.url.searchParams.get("ref") ?? "").toUpperCase();
  let submitted = !!refInput;
  let currentRef = refInput;

  $: docQuery = useQuery(submitted ? api.legalDocuments.getDocumentByReference : null, { referenceCode: currentRef });

  function search() {
    if (!refInput.trim()) return;
    currentRef = refInput.trim().toUpperCase();
    submitted = true;
    goto(`/legal/track?ref=${currentRef}`, { replaceState: true });
  }

  const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof CheckCircle; note: string }> = {
    DRAFT:             { label: "Under Review",       color: "#94a3b8", icon: Clock,         note: "Our legal team is reviewing and preparing your document." },
    PENDING_SIGNATURE: { label: "Awaiting Signature",  color: "#f59e0b", icon: AlertCircle,   note: "Your document has been sent for e-signature. Please check your email." },
    SIGNED:            { label: "Signed",              color: "#60a5fa", icon: CheckCircle,   note: "All parties have signed. Awaiting admin verification." },
    VERIFIED:          { label: "Verified & Complete", color: "#34d399", icon: CheckCircle,   note: "Your document is fully verified and legally binding." },
    REJECTED:          { label: "Rejected",            color: "#f87171", icon: AlertCircle,   note: "There was an issue. Contact support@alikodiamondkey.com." },
    EXPIRED:           { label: "Expired",             color: "#94a3b8", icon: AlertCircle,   note: "This document has expired. Please contact us to renew." },
  };

  const ACTION_LABELS: Record<string, string> = {
    CREATED:            "Document created",
    DRAFT:              "Under review",
    PENDING_SIGNATURE:  "Sent for e-signature",
    SIGNED:             "Signed by all parties",
    VERIFIED:           "Verified by ADK admin",
    REJECTED:           "Rejected",
  };
</script>

<svelte:head>
  <title>Track Legal Document — Aliko Diamond Key</title>
</svelte:head>

<div style="background: var(--c-obsidian); min-height: 100vh">
  <!-- Header -->
  <div class="relative py-16 overflow-hidden" style="background: linear-gradient(180deg, rgba(6,78,59,0.18) 0%, transparent 100%)">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 text-center">
      <Shield class="w-12 h-12 text-emerald-500 mx-auto mb-4" />
      <h1 class="font-serif text-display-md text-white mb-3" style="letter-spacing:-0.02em">Document Tracker</h1>
      <p class="text-stone-400">Enter your reference code to view the status and audit trail of your legal document.</p>
    </div>
  </div>

  <div class="max-w-2xl mx-auto px-4 sm:px-6 pb-20">
    <!-- Search -->
    <div class="glass rounded-2xl p-4 mb-8">
      <div class="flex gap-3">
        <div class="flex-1 relative">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <input
            type="text"
            placeholder="e.g. DOA-LX9F2K"
            bind:value={refInput}
            on:keydown={e => e.key === "Enter" && search()}
            class="input-luxury pl-10 font-mono tracking-widest uppercase"
          />
        </div>
        <button on:click={search}
                class="px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 active:scale-95"
                style="background: linear-gradient(135deg, #059669, #065f46)">
          Track
        </button>
      </div>
    </div>

    {#if submitted}
      {#if $docQuery === undefined}
        <div class="space-y-3">
          {#each Array(4) as _}<div class="skeleton h-14 rounded-2xl" />{/each}
        </div>

      {:else if $docQuery === null}
        <div class="glass rounded-2xl p-8 text-center">
          <AlertCircle class="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <p class="text-white font-semibold mb-1">Reference not found</p>
          <p class="text-stone-500 text-sm">Check the reference code and try again, or contact <a href="mailto:legal@alikodiamondkey.com" class="text-emerald-400 underline">legal@alikodiamondkey.com</a>.</p>
        </div>

      {:else}
        {@const doc = $docQuery}
        {@const statusInfo = STATUS_MAP[doc.status]}

        <!-- Status card -->
        <div class="rounded-2xl p-6 mb-6" style="background: #0A1628; border: 1px solid rgba(255,255,255,0.06)">
          <div class="flex items-start justify-between mb-6">
            <div>
              <span class="text-xs font-bold uppercase tracking-widest text-stone-600">{doc.type.replace(/_/g, " ")}</span>
              <h2 class="text-white font-bold text-xl mt-1 font-mono">{doc.referenceCode}</h2>
            </div>
            {#if doc.pdfUrl}
              <a href={doc.pdfUrl} target="_blank" download
                 class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-80 transition-opacity"
                 style="background: rgba(5,150,105,0.15); border: 1px solid rgba(5,150,105,0.25)">
                <Download class="w-4 h-4" /> Download PDF
              </a>
            {/if}
          </div>

          <!-- Status pill -->
          <div class="flex items-center gap-3 p-4 rounded-xl mb-4" style="background: rgba(255,255,255,0.03)">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: {statusInfo.color}18">
              <svelte:component this={statusInfo.icon} class="w-5 h-5" style="color: {statusInfo.color}" />
            </div>
            <div>
              <p class="font-bold" style="color: {statusInfo.color}">{statusInfo.label}</p>
              <p class="text-stone-500 text-xs mt-0.5">{statusInfo.note}</p>
            </div>
          </div>

          <!-- Property info -->
          {#if doc.plot}
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 rounded-xl" style="background: rgba(255,255,255,0.03)">
                <p class="text-stone-600 text-xs">Plot</p>
                <p class="text-white text-sm font-medium mt-0.5">Beacon {doc.plot.beaconNumber}</p>
              </div>
              <div class="p-3 rounded-xl" style="background: rgba(255,255,255,0.03)">
                <p class="text-stone-600 text-xs">Size</p>
                <p class="text-white text-sm font-medium mt-0.5">{doc.plot.sizeSqm} sqm</p>
              </div>
            </div>
          {/if}
        </div>

        <!-- Audit trail -->
        <div class="rounded-2xl overflow-hidden" style="background: #0A1628; border: 1px solid rgba(255,255,255,0.06)">
          <div class="px-5 py-4" style="border-bottom: 1px solid rgba(255,255,255,0.06)">
            <h3 class="font-semibold text-white text-sm">Document Timeline</h3>
          </div>
          <div class="p-5">
            <div class="relative">
              <div class="absolute left-3.5 top-0 bottom-0 w-px" style="background: rgba(255,255,255,0.06)" />
              <div class="space-y-4">
                {#each doc.auditLog as entry}
                  <div class="flex items-start gap-4 relative">
                    <div class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 relative z-10"
                         style="background: #0A1628; border: 2px solid rgba(5,150,105,0.4)">
                      <div class="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div class="flex-1 pb-1">
                      <p class="text-white text-sm font-medium">{ACTION_LABELS[entry.action] ?? entry.action}</p>
                      <div class="flex items-center gap-3 mt-0.5">
                        <span class="text-stone-600 text-xs">{formatDateTime(entry.createdAt)}</span>
                        {#if entry.actorRole}
                          <span class="text-xs font-mono px-1.5 py-0.5 rounded" style="background:rgba(255,255,255,0.04);color:#64748b">{entry.actorRole}</span>
                        {/if}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>
