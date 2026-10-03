<script lang="ts">
  import { getI18n } from "$lib/i18n";
  import { api } from "$lib/convex/_generated/api";
  import { useQuery } from "$lib/convex/queries";
  import { formatNaira } from "$lib/utils/format";
  import CheckoutButton from "$lib/components/payments/CheckoutButton.svelte";
  const enrolments = useQuery(api.partners.myEnrolments, {});
  const { t: adkT, locale } = getI18n();
  const orders = useQuery(api.checkout.mine, {});
  const bookings = useQuery(api.bookings.getMyBookings, {});
</script>

<div class="theme-surface theme-text p-6 space-y-5">
  <h1 class="text-3xl font-bold">{$adkT("My payments")}</h1>
  {#each $orders ?? [] as order}<a
      class="block rounded-xl border p-4"
      href={`/checkout/${encodeURIComponent(order.reference)}`}
      ><span dir="auto">{order.title}</span> · {formatNaira(
        order.amount,
        $locale,
      )} · {$adkT(order.status)}</a
    >{/each}
  {#each $bookings ?? [] as booking}<a
      class="block rounded-xl border p-4"
      href={`/checkout/${encodeURIComponent(booking.reference)}`}
      >{booking.reference} · {formatNaira(booking.totalAmount, $locale)} · {$adkT(
        booking.paymentStatus,
      )}</a
    >{/each}
  {#if $orders?.length === 0 && $bookings?.length === 0}<p>
      {$adkT("No payments yet.")}
    </p>{/if}
</div>

{#each $enrolments?.managers ?? [] as manager}{#if manager.plan !== "ENTERPRISE" && manager.status !== "SUSPENDED" && (manager.paidThrough ?? 0) <= Date.now()}<section
      class="theme-surface theme-text m-6 p-5 border rounded-xl"
    >
      <h2>{manager.companyName} · {$adkT(manager.plan)}</h2>
      <CheckoutButton
        kind="MANAGER"
        targetId={manager._id}
        label="Review plan payment"
      />
    </section>{/if}{/each}
