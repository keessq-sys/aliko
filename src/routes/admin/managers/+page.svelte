<script lang="ts">
  import { useQuery, runMutation } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { Building2, CheckCircle, PauseCircle, Loader2 } from "lucide-svelte";
  import { formatRelative } from "$lib/utils/format";
  import { REQUEST_STATUS_META } from "$lib/types/services";

  const managers = useQuery(api.partners.listManagers, {});
  const review = async (args: any) => runMutation(api.partners.reviewManagerApplication, args);

  let actingId: string | null = null;
  let error = "";

  async function act(id: any, status: "APPROVED" | "SUSPENDED" | "PENDING") {
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

<svelte:head><title>Manager Approvals — ADK Admin</title></svelte:head>

<div class="p-8">
  <div class="mb-6">
    <h1 class="flex items-center gap-2 text-xl font-bold text-white"><Building2 class="h-5 w-5 text-blue-400" /> Estate Manager Enrolments</h1>
    <p class="mt-0.5 text-sm text-stone-500">Approve companies enrolling to manage properties on ADK.</p>
  </div>

  {#if error}
    <p class="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">{error}</p>
  {/if}

  <div class="overflow-hidden rounded-2xl" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
    {#if $managers === undefined}
      <div class="flex items-center justify-center py-16 text-stone-500"><Loader2 class="h-6 w-6 animate-spin" /></div>
    {:else if $managers.length === 0}
      <p class="py-16 text-center text-sm text-stone-600">No enrolments yet. Manager submissions appear here instantly.</p>
    {:else}
      <table class="w-full text-left text-sm">
        <thead class="bg-white/5 text-stone-400">
          <tr>
            <th class="px-6 py-4">Company</th>
            <th class="px-6 py-4">Contact</th>
            <th class="px-6 py-4">States</th>
            <th class="px-6 py-4">Plan</th>
            <th class="px-6 py-4">Status</th>
            <th class="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          {#each $managers as m (m._id)}
            <tr class="hover:bg-white/5">
              <td class="px-6 py-4">
                <p class="font-medium text-white">{m.companyName}</p>
                <p class="text-xs text-stone-500">CAC: {m.cacRcNumber ?? '—'} · {m.portfolioSize ?? '—'} units</p>
              </td>
              <td class="px-6 py-4 text-stone-300">
                {m.contactName}<br />
                <span class="text-xs text-stone-500">{m.email} · {m.phone}</span>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  {#each m.statesOfOperation ?? [] as s}
                    <span class="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-stone-300">{s}</span>
                  {/each}
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-300">{m.plan}</span>
              </td>
              <td class="px-6 py-4">
                <span class="rounded-full px-2.5 py-1 text-xs font-semibold {REQUEST_STATUS_META[m.status]?.classes ?? ''}">{REQUEST_STATUS_META[m.status]?.label ?? m.status}</span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  {#if m.status !== "APPROVED"}
                    <button
                      on:click={() => act(m._id, "APPROVED")}
                      disabled={actingId === String(m._id)}
                      class="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                    >
                      {#if actingId === String(m._id)}<Loader2 size={12} class="animate-spin" />{:else}<CheckCircle size={12} />{/if}
                      Approve
                    </button>
                  {:else}
                    <button
                      on:click={() => act(m._id, "SUSPENDED")}
                      disabled={actingId === String(m._id)}
                      class="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
                    >
                      <PauseCircle size={12} /> Suspend
                    </button>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
