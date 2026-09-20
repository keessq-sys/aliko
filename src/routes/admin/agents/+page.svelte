<script lang="ts">
  import { useQuery, runMutation } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { Briefcase, CheckCircle, XCircle, Loader2 } from "lucide-svelte";
  import { formatRelative } from "$lib/utils/format";
  import { REQUEST_STATUS_META } from "$lib/types/services";

  const applications = useQuery(api.partners.listAgentApplications, {});
  const review = async (args: any) => runMutation(api.partners.reviewAgentApplication, args);

  let actingId: string | null = null;
  let error = "";

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
  <div class="mb-6">
    <h1 class="flex items-center gap-2 text-xl font-bold text-white"><Briefcase class="h-5 w-5 text-amber-400" /> Agent Applications</h1>
    <p class="mt-0.5 text-sm text-stone-500">Review and approve agents from the 5-step registration wizard.</p>
  </div>

  {#if error}
    <p class="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">{error}</p>
  {/if}

  <div class="overflow-hidden rounded-2xl" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
    {#if $applications === undefined}
      <div class="flex items-center justify-center py-16 text-stone-500"><Loader2 class="h-6 w-6 animate-spin" /></div>
    {:else if $applications.length === 0}
      <p class="py-16 text-center text-sm text-stone-600">No agent applications yet. New wizard submissions appear here instantly.</p>
    {:else}
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
          {#each $applications as app (app._id)}
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
    {/if}
  </div>
</div>
