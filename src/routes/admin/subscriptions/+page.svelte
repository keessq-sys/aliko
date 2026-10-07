<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  import { api } from "$lib/convex/_generated/api";
  import { useQuery, runMutation } from "$lib/convex/queries";
  const adkT = getTranslation();
  const subscriptions = useQuery(api.subscriptions.adminList, {});
  let reason = "",
    error = "",
    busy = false;
  async function revoke(id: string) {
    busy = true;
    error = "";
    try {
      await runMutation(api.subscriptions.revoke, { id: id as any, reason });
    } catch (e) {
      error = e instanceof Error ? e.message : "Action failed.";
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head
  ><title>{$adkT("Subscriptions")} | Aliko Diamond Key</title></svelte:head
>
<main class="theme-surface theme-text mx-auto max-w-5xl p-6 space-y-5">
  <a class="underline" href="/admin">{$adkT("Admin Console")}</a>
  <h1 class="text-3xl font-bold">{$adkT("Subscriptions")}</h1>
  <label class="block"
    >{$adkT("Revocation reason")}<input
      bind:value={reason}
      minlength="5"
      class="theme-input w-full rounded-lg border p-3"
    /></label
  >
  {#if error}<p role="alert">{$adkT(error)}</p>{/if}
  {#each $subscriptions ?? [] as row}
    <article class="rounded-xl border p-4 space-y-2">
      <h2 class="font-bold">{row.plan} · {$adkT(row.status)}</h2>
      <p class="break-all">
        {$adkT("Account")}: {row.ownerId} · {$adkT("Payment")}: {row.orderId}
      </p>
      <p>
        ₦{row.amount.toLocaleString()} · {new Date(
          row.endsAt,
        ).toLocaleDateString()}
      </p>
      {#if row.status === "ACTIVE"}<button
          class="rounded-lg border p-3 min-h-[44px]"
          disabled={busy || reason.trim().length < 5}
          on:click={() => revoke(row._id)}>{$adkT("Revoke access")}</button
        >{/if}
    </article>
  {:else}<p>{$adkT("No subscription records yet.")}</p>{/each}
</main>
