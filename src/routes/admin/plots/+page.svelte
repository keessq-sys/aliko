<script lang="ts">
  import { useQuery, runMutation } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { Map, ShieldCheck, AlertTriangle, Loader2, Search } from "lucide-svelte";
  import { formatNaira, formatSqm } from "$lib/utils/format";

  const plots = useQuery(api.plots.listPlots, { limit: 200 });
  const verifyPlotTitle = async (args: any) => runMutation(api.plots.verifyPlotTitle, args);

  let search = "";
  let onlyUnverified = true;
  let actingId: string | null = null;
  let error = "";

  $: filtered = ($plots ?? []).filter((p: any) => {
    if (onlyUnverified && p.titleVerified) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return p.beaconNumber?.toLowerCase().includes(q) || p.plotNumber?.toLowerCase().includes(q);
  });

  async function verify(id: any) {
    actingId = String(id);
    error = "";
    try {
      await verifyPlotTitle({ plotId: id, titleVerified: true });
    } catch (err: any) {
      error = err?.message ?? "Verification failed.";
    } finally {
      actingId = null;
    }
  }
</script>

<svelte:head><title>Plot Verification — ADK Admin</title></svelte:head>

<div class="p-8">
  <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div>
      <h1 class="flex items-center gap-2 text-xl font-bold text-white"><Map class="h-5 w-5 text-emerald-400" /> Plot Verification Queue</h1>
      <p class="mt-0.5 text-sm text-stone-500">Confirm title documents (C of O, Governor's Consent, Deed) before plots go live.</p>
    </div>
    <div class="flex items-center gap-3">
      <label class="flex items-center gap-2 text-xs text-stone-400">
        <input type="checkbox" bind:checked={onlyUnverified} class="rounded border-white/20 bg-black/40 text-emerald-500 focus:ring-emerald-500" />
        Unverified only
      </label>
      <div class="relative">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-500" />
        <input type="text" bind:value={search} placeholder="Beacon / plot no." class="w-52 rounded-xl border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-xs text-white placeholder-stone-600 outline-none focus:border-emerald-500" />
      </div>
    </div>
  </div>

  {#if error}
    <p class="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">{error}</p>
  {/if}

  {#if $plots}
    <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div class="rounded-xl px-4 py-3" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06)">
        <p class="text-xl font-black text-white">{$plots.length}</p>
        <p class="text-xs text-stone-500">Total Plots</p>
      </div>
      <div class="rounded-xl px-4 py-3" style="background: rgba(5,150,105,0.08); border: 1px solid rgba(5,150,105,0.2)">
        <p class="text-xl font-black text-emerald-400">{$plots.filter((p: any) => p.status === 'AVAILABLE').length}</p>
        <p class="text-xs text-stone-500">Available</p>
      </div>
      <div class="rounded-xl px-4 py-3" style="background: rgba(217,119,6,0.08); border: 1px solid rgba(217,119,6,0.2)">
        <p class="text-xl font-black text-amber-400">{$plots.filter((p: any) => !p.titleVerified).length}</p>
        <p class="text-xs text-stone-500">Unverified Titles</p>
      </div>
      <div class="rounded-xl px-4 py-3" style="background: rgba(37,99,235,0.08); border: 1px solid rgba(37,99,235,0.2)">
        <p class="text-xl font-black text-blue-300">{$plots.filter((p: any) => p.status === 'SOLD').length}</p>
        <p class="text-xs text-stone-500">Sold</p>
      </div>
    </div>
  {/if}

  <div class="overflow-hidden rounded-2xl" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
    {#if $plots === undefined}
      <div class="flex items-center justify-center py-16 text-stone-500"><Loader2 class="h-6 w-6 animate-spin" /></div>
    {:else if filtered.length === 0}
      <div class="py-16 text-center">
        <ShieldCheck class="mx-auto mb-3 h-10 w-10 text-emerald-500/40" />
        <p class="text-sm text-stone-500">{onlyUnverified ? 'All plots are verified. 🎉' : 'No plots found.'}</p>
      </div>
    {:else}
      <table class="w-full text-left text-sm">
        <thead class="bg-white/5 text-stone-400">
          <tr>
            <th class="px-6 py-4">Plot</th>
            <th class="px-6 py-4">Size</th>
            <th class="px-6 py-4">Price</th>
            <th class="px-6 py-4">Title Type</th>
            <th class="px-6 py-4">Status</th>
            <th class="px-6 py-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          {#each filtered.slice(0, 50) as plot (plot._id)}
            <tr class="hover:bg-white/5">
              <td class="px-6 py-4">
                <p class="font-medium text-white">Beacon {plot.beaconNumber}</p>
                <p class="text-xs text-stone-500">Plot {plot.plotNumber}</p>
              </td>
              <td class="px-6 py-4 text-stone-300">{formatSqm(plot.sizeSqm)}</td>
              <td class="px-6 py-4 text-white">{formatNaira(plot.price)}</td>
              <td class="px-6 py-4"><span class="text-xs text-stone-300">{plot.titleType.replace(/_/g, ' ')}</span></td>
              <td class="px-6 py-4">
                {#if plot.titleVerified}
                  <span class="inline-flex items-center gap-1 text-xs text-emerald-400"><ShieldCheck size={13} /> Verified</span>
                {:else}
                  <span class="inline-flex items-center gap-1 text-xs text-amber-400"><AlertTriangle size={13} /> Pending</span>
                {/if}
              </td>
              <td class="px-6 py-4 text-right">
                {#if !plot.titleVerified}
                  <button
                    on:click={() => verify(plot._id)}
                    disabled={actingId === String(plot._id)}
                    class="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {#if actingId === String(plot._id)}<Loader2 size={12} class="inline animate-spin" />{:else}Verify Title{/if}
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
