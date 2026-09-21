<script lang="ts">
  import { useQuery, runMutation } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { DollarSign, Loader2, Search, XCircle } from "lucide-svelte";
  import { formatNaira, formatRelative } from "$lib/utils/format";

  const bookings = useQuery(api.bookings.getAllBookings, { limit: 200 });

  const STATUS_CLASSES: Record<string, string> = {
    PENDING: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    PARTIAL: "text-blue-300 bg-blue-500/10 border-blue-500/30",
    SUCCESS: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    FAILED: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    REFUNDED: "text-stone-400 bg-stone-500/10 border-stone-500/30"
  };

  let statusFilter = "";
  let search = "";
  const STATUS_FILTERS = ["", "PENDING", "PARTIAL", "SUCCESS", "FAILED", "REFUNDED"] as const;

  $: statusCounts = ($bookings ?? []).reduce((acc: Record<string, number>, b: any) => {
    acc[b.paymentStatus] = (acc[b.paymentStatus] ?? 0) + 1;
    return acc;
  }, {});

  $: filtered = ($bookings ?? []).filter((b: any) => {
    if (statusFilter && b.paymentStatus !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.reference.toLowerCase().includes(q) ||
      (b.client?.name ?? "").toLowerCase().includes(q) ||
      (b.plot?.beaconNumber ?? "").toLowerCase().includes(q) ||
      (b.project?.name ?? "").toLowerCase().includes(q)
    );
  });

  let cancelingId: string | null = null;

  async function cancel(bookingId: string) {
    if (!confirm("Cancel this booking and release the plot back to AVAILABLE?")) return;
    cancelingId = bookingId;
    try {
      await runMutation(api.bookings.cancelBooking, { bookingId, reason: "Cancelled by admin" } as any);
    } catch (err) {
      alert((err as Error).message ?? "Failed to cancel booking.");
    } finally {
      cancelingId = null;
    }
  }
</script>

<svelte:head><title>Bookings — ADK Admin</title></svelte:head>

<div class="p-8">
  <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div>
      <h1 class="flex items-center gap-2 text-xl font-bold text-white"><DollarSign class="h-5 w-5 text-emerald-400" /> Bookings</h1>
      <p class="mt-0.5 text-sm text-stone-500">Every plot reservation and its payment status.</p>
    </div>
    <div class="relative">
      <Search class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-500" />
      <input type="text" bind:value={search} placeholder="Search reference, client, plot…" class="w-64 rounded-xl border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-xs text-white placeholder-stone-600 outline-none focus:border-emerald-500" />
    </div>
  </div>

  <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
    <div class="rounded-xl px-4 py-3" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06)">
      <p class="text-xl font-black text-white">{$bookings?.length ?? '—'}</p>
      <p class="text-xs text-stone-500">Total</p>
    </div>
    <div class="rounded-xl px-4 py-3" style="background: rgba(217,119,6,0.08); border: 1px solid rgba(217,119,6,0.2)">
      <p class="text-xl font-black text-amber-400">{statusCounts.PENDING ?? 0}</p>
      <p class="text-xs text-stone-500">Pending</p>
    </div>
    <div class="rounded-xl px-4 py-3" style="background: rgba(37,99,235,0.08); border: 1px solid rgba(37,99,235,0.2)">
      <p class="text-xl font-black text-blue-300">{statusCounts.PARTIAL ?? 0}</p>
      <p class="text-xs text-stone-500">Partial</p>
    </div>
    <div class="rounded-xl px-4 py-3" style="background: rgba(5,150,105,0.08); border: 1px solid rgba(5,150,105,0.2)">
      <p class="text-xl font-black text-emerald-400">{statusCounts.SUCCESS ?? 0}</p>
      <p class="text-xs text-stone-500">Paid</p>
    </div>
    <div class="rounded-xl px-4 py-3" style="background: rgba(225,29,72,0.08); border: 1px solid rgba(225,29,72,0.2)">
      <p class="text-xl font-black text-rose-400">{statusCounts.FAILED ?? 0}</p>
      <p class="text-xs text-stone-500">Failed / Cancelled</p>
    </div>
  </div>

  <div class="mb-6 flex flex-wrap gap-2">
    {#each STATUS_FILTERS as s}
      <button
        on:click={() => (statusFilter = s)}
        class="min-h-[44px] rounded-full px-3.5 py-1.5 text-xs font-medium transition-all {statusFilter === s
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          : 'bg-white/5 text-stone-400 border border-white/10 hover:text-white'}"
      >
        {s || 'All'}
      </button>
    {/each}
  </div>

  <div class="overflow-hidden rounded-2xl" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
    {#if $bookings === undefined}
      <div class="flex items-center justify-center py-16 text-stone-500"><Loader2 class="h-6 w-6 animate-spin" /></div>
    {:else if filtered.length === 0}
      <p class="py-16 text-center text-sm text-stone-600">{$bookings.length === 0 ? "No bookings yet." : "No bookings match this view."}</p>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-white/5 text-stone-400">
            <tr>
              <th class="px-6 py-4">Reference</th>
              <th class="px-6 py-4">Client</th>
              <th class="px-6 py-4">Plot</th>
              <th class="px-6 py-4">Plan</th>
              <th class="px-6 py-4">Paid / Total</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4">Date</th>
              <th class="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            {#each filtered as b (b._id)}
              <tr class="hover:bg-white/5">
                <td class="px-6 py-4 font-mono text-xs text-stone-400">{b.reference}</td>
                <td class="px-6 py-4 text-white">{b.client?.name ?? '—'}</td>
                <td class="px-6 py-4 text-stone-300">{b.plot?.beaconNumber ?? '—'} <span class="text-xs text-stone-600">{b.project?.name ?? ''}</span></td>
                <td class="px-6 py-4 text-stone-400">{b.installmentPlan ?? 'OUTRIGHT'}</td>
                <td class="px-6 py-4 text-white">{formatNaira(b.paidAmount)} <span class="text-xs text-stone-600">/ {formatNaira(b.totalAmount)}</span></td>
                <td class="px-6 py-4">
                  <span class="rounded-full border px-2.5 py-1 text-xs font-semibold {STATUS_CLASSES[b.paymentStatus] ?? 'text-stone-400 bg-stone-500/10 border-stone-500/30'}">
                    {b.paymentStatus}
                  </span>
                </td>
                <td class="px-6 py-4 text-xs text-stone-600">{formatRelative(new Date(b.createdAt))}</td>
                <td class="px-6 py-4 text-right">
                  {#if b.paidAmount === 0 && b.paymentStatus !== 'FAILED'}
                    <button
                      type="button"
                      disabled={cancelingId === b._id}
                      on:click={() => cancel(b._id)}
                      class="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs text-rose-300 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
                    >
                      {#if cancelingId === b._id}<Loader2 size={13} class="animate-spin" />{:else}<XCircle size={13} />{/if} Cancel
                    </button>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
