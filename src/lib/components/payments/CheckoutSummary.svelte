<script lang="ts">
  import { CheckCircle2, Landmark, LockKeyhole, ReceiptText, ShieldCheck } from 'lucide-svelte';
  import { formatNaira } from '$lib/utils/format';

  export let booking: any;
</script>

<aside class="rounded-2xl border border-white/10 bg-[#0A1628] p-6 shadow-2xl shadow-black/30">
  <div class="mb-6 flex items-center gap-3 border-b border-white/10 pb-5">
    <div class="rounded-xl bg-emerald-500/10 p-3 text-emerald-400"><Landmark size={22} /></div>
    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-stone-500">Land reservation</p>
      <h2 class="font-serif text-xl font-bold text-white">{booking.plot?.beaconNumber ?? 'Verified plot'}</h2>
      <p class="text-xs text-stone-500">{booking.project?.name ?? 'Aliko Diamond Key'}</p>
    </div>
  </div>

  <dl class="space-y-3 text-sm">
    <div class="flex justify-between gap-4"><dt class="text-stone-500">Booking reference</dt><dd class="font-mono text-xs text-stone-300">{booking.reference}</dd></div>
    <div class="flex justify-between gap-4"><dt class="text-stone-500">Payment plan</dt><dd class="font-medium text-white">{booking.installmentPlan?.replace(/-/g, ' ') ?? 'OUTRIGHT'}</dd></div>
    <div class="flex justify-between gap-4"><dt class="text-stone-500">Already paid</dt><dd class="text-stone-300">{formatNaira(booking.paidAmount)}</dd></div>
    <div class="flex items-end justify-between gap-4 border-t border-white/10 pt-4">
      <dt class="font-medium text-white">Amount due</dt>
      <dd class="text-2xl font-black text-amber-400">{formatNaira(Math.max(booking.totalAmount - booking.paidAmount, 0))}</dd>
    </div>
  </dl>

  <div class="mt-6 grid gap-3 text-xs text-stone-400">
    <p class="flex items-center gap-2"><ShieldCheck size={15} class="text-emerald-400" /> Server-verified payment before allocation</p>
    <p class="flex items-center gap-2"><LockKeyhole size={15} class="text-emerald-400" /> Card details stay on Flutterwave's secure checkout</p>
    <p class="flex items-center gap-2"><ReceiptText size={15} class="text-emerald-400" /> Payment recorded against your account</p>
    <p class="flex items-center gap-2"><CheckCircle2 size={15} class="text-emerald-400" /> Realtime booking and plot status updates</p>
  </div>
</aside>
