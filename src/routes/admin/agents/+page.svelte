<script lang="ts">
  import { useQuery, runMutation } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { Briefcase, CheckCircle, XCircle, Loader2, Search } from "lucide-svelte";
  import { formatRelative } from "$lib/utils/format";
  import { REQUEST_STATUS_META } from "$lib/types/services";

  const applications = useQuery(api.partners.listAgentApplications, {});
  const review = async (args: any) => runMutation(api.partners.reviewAgentApplication, args);

  let actingId: string | null = null;
  let error = "";
  let search = "";

  $: filtered = ($applications ?? []).filter((a: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.fullName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || (a.agencyName ?? '').toLowerCase().includes(q);
  });
  $: pendingCount = ($applications ?? []).filter((a: any) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW').length;
  $: approvedCount = ($applications ?? []).filter((a: any) => a.status === 'APPROVED').length;

  async function act(id: any, status: "APPROVED" | "REJECTED" | "UNDER_REVIEW") {
    actingId = String(id);
    error = "";
    try {
      await review({ id, status });
    } catch (err: any) {
      error = err?.message ?? "Action failed.";
    } finally {
      actingId = null;
    }
  }
</script>

<svelte:head><title>Agent Approvals — ADK Admin</title></svelte:head>

<div class="p-8">
  <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div>
      <h1 class="flex items-center gap-2 text-xl font-bold text-white"><Briefcase class="h-5 w-5 text-amber-400" /> Agent Applications</h1>
      <p class="mt-0.5 text-sm text-stone-500">Review and approve agents from the 5-step registration wizard.</p>
    </div>
    <div class="relative">
      <Search class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-500" />
      <input type="text" bind:value={search} placeholder="Search name, email, agency…" class="w-64 rounded-xl border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-xs text-white placeholder-stone-600 outline-none focus:border-emerald-500" />
    </div>
  </div>

  {#if $applications}
    <div class="mb-6 grid grid-cols-3 gap-3">
      <div class="rounded-xl px-4 py-3" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06)">
        <p class="text-xl font-black text-white">{$applications.length}</p>
        <p class="text-xs text-stone-500">Total Applications</p>
      </div>
      <div class="rounded-xl px-4 py-3" style="background: rgba(217,119,6,0.08); border: 1px solid rgba(217,119,6,0.2)">
        <p class="text-xl font-black text-amber-400">{pendingCount}</p>
        <p class="text-xs text-stone-500">Pending Review</p>
      </div>
      <div class="rounded-xl px-4 py-3" style="background: rgba(5,150,105,0.08); border: 1px solid rgba(5,150,105,0.2)">
        <p class="text-xl font-black text-emerald-400">{approvedCount}</p>
        <p class="text-xs text-stone-500">Approved</p>
      </div>
    </div>
  {/if}

  {#if error}
    <p class="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">{error}</p>
  {/if}

  <div class="overflow-hidden rounded-2xl" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
    {#if $applications === undefined}
      <div class="flex items-center justify-center py-16 text-stone-500"><Loader2 class="h-6 w-6 animate-spin" /></div>
    {:else if filtered.length === 0}
      <p class="py-16 text-center text-sm text-stone-600">{$applications.length === 0 ? "No agent applications yet. New wizard submissions appear here instantly." : "No applications match your search."}</p>
    {:else}
      <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-white/5 text-stone-400">
          <tr>
            <th class="px-6 py-4">Applicant</th>
            <th class="px-6 py-4">Agency</th>
            <th class="px-6 py-4">Specializations</th>
            <th class="px-6 py-4">Submitted</th>
            <th class="px-6 py-4">Status</th>
            <th class="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          {#each filtered as app (app._id)}
            <tr class="hover:bg-white/5">
              <td class="px-6 py-4">
                <p class="font-medium text-white">{app.fullName}</p>
                <p class="text-xs text-stone-500">{app.email} · {app.phone}</p>
                <p class="font-mono text-[10px] text-stone-600">{app.reference}</p>
              </td>
              <td class="px-6 py-4 text-stone-300">{app.agencyName ?? "—"}<br /><span class="text-xs text-stone-600">{app.experience ?? ''} yrs</span></td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  {#each app.specializations ?? [] as spec}
                    <span class="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-stone-300">{spec}</span>
                  {/each}
                </div>
              </td>
              <td class="px-6 py-4 text-stone-400">{formatRelative(new Date(app.createdAt))}</td>
              <td class="px-6 py-4">
                <span class="rounded-full px-2.5 py-1 text-xs font-semibold {REQUEST_STATUS_META[app.status]?.classes ?? ''}">{REQUEST_STATUS_META[app.status]?.label ?? app.status}</span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button
                    on:click={() => act(app._id, "APPROVED")}
                    disabled={actingId === String(app._id)}
                    class="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {#if actingId === String(app._id)}<Loader2 size={12} class="animate-spin" />{:else}<CheckCircle size={12} />{/if}
                    Approve
                  </button>
                  <button
                    on:click={() => act(app._id, "REJECTED")}
                    disabled={actingId === String(app._id)}
                    class="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    <XCircle size={12} /> Reject
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      </div>
    {/if}
  </div>
</div>
