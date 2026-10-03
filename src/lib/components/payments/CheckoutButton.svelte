<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  import { goto } from "$app/navigation";
  import { api } from "$lib/convex/_generated/api";
  import { runMutation } from "$lib/convex/queries";
  const adkT = getTranslation();
  export let kind: "PROPERTY" | "SERVICE" | "MANAGER";
  export let targetId: string;
  export let label = "Review and pay";
  let busy = false,
    error = "";
  async function start() {
    busy = true;
    error = "";
    try {
      const order = await runMutation(api.checkout.create, { kind, targetId });
      await goto(`/checkout/${encodeURIComponent(order.reference)}`);
    } catch (e) {
      error = e instanceof Error ? e.message : "Could not create checkout.";
    } finally {
      busy = false;
    }
  }
</script>

<button
  type="button"
  class="btn-primary min-h-[44px] px-4 py-3"
  on:click={start}
  disabled={busy}>{$adkT(busy ? "Preparing checkout…" : label)}</button
>
{#if error}<p role="alert" class="theme-text mt-2 text-sm">
    {$adkT(error)}
    <a class="underline" href="/dashboard/account">{$adkT("My profile")}</a>
  </p>{/if}
