<script lang="ts">
  import { getI18n } from "$lib/i18n";
  const { locale: adkLocale } = getI18n();

  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();

  import { CheckCircle2, Landmark, LockKeyhole, ReceiptText, ShieldCheck } from 'lucide-svelte';
  import { formatNaira } from '$lib/utils/format';

  export let booking: any;
</script>

<aside class="rounded-2xl border border-white/10 bg-[#0A1628] p-6 shadow-2xl shadow-black/30">
  <div class="mb-6 flex items-center gap-3 border-b border-white/10 pb-5">
    <div class="rounded-xl bg-emerald-500/10 p-3 text-emerald-400"><Landmark size={22} /></div>
    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-stone-500">{$adkT("Land reservation")}</p>
      <h2 class="font-serif text-xl font-bold text-white">{$adkT(booking.plot?.beaconNumber ?? 'Verified plot')}</h2>
      <p class="text-xs text-stone-500">{$adkT(booking.project?.name ?? 'Aliko Diamond Key')}</p>
    </div>
  </div>

  <dl class="space-y-3 text-sm">
    <div class="flex justify-between gap-4"><dt class="text-stone-500">{$adkT("Booking reference")}</dt><dd class="font-mono text-xs text-stone-300">{$adkT(booking.reference)}</dd></div>
    <div class="flex justify-between gap-4"><dt class="text-stone-500">{$adkT("Payment plan")}</dt><dd class="font-medium text-white">{$adkT(booking.installmentPlan?.replace(/-/g, ' ') ?? 'OUTRIGHT')}</dd></div>
    <div class="flex justify-between gap-4"><dt class="text-stone-500">{$adkT("Already paid")}</dt><dd class="text-stone-300">{$adkT(formatNaira(booking.paidAmount, $adkLocale))}</dd></div>
    <div class="flex items-end justify-between gap-4 border-t border-white/10 pt-4">
      <dt class="font-medium text-white">{$adkT("Amount due")}</dt>
      <dd class="text-2xl font-black text-amber-400">{$adkT(formatNaira(Math.max(booking.totalAmount - booking.paidAmount, 0), $adkLocale))}</dd>
    </div>
  </dl>

  <div class="mt-6 grid gap-3 text-xs text-stone-400">
    <p class="flex items-center gap-2"><ShieldCheck size={15} class="text-emerald-400" /> {$adkT("Server-verified payment before allocation")}</p>
    <p class="flex items-center gap-2"><LockKeyhole size={15} class="text-emerald-400" /> {$adkT("Card details stay on Flutterwave's secure checkout")}</p>
    <p class="flex items-center gap-2"><ReceiptText size={15} class="text-emerald-400" /> {$adkT("Payment recorded against your account")}</p>
    <p class="flex items-center gap-2"><CheckCircle2 size={15} class="text-emerald-400" /> {$adkT("Realtime booking and plot status updates")}</p>
  </div>
</aside>
