<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  import { api } from "$lib/convex/_generated/api";
  import { useQuery, runMutation } from "$lib/convex/queries";
  import { goto } from "$app/navigation";
  const adkT = getTranslation();
  const subscriptions = useQuery(api.subscriptions.mine, {});
  const enrollments = useQuery(api.partners.myEnrolments, {});
  let error = "",
    busy = false,
    plan: "STARTER" | "PROFESSIONAL" = "STARTER";
  async function renew() {
    const manager = $enrollments?.managers[0];
    if (!manager) return;
    busy = true;
    error = "";
    try {
      await runMutation(api.subscriptions.selectPlan, {
        managerId: manager._id,
        plan,
      });
      const result = await runMutation(api.checkout.create, {
        kind: "MANAGER",
        targetId: manager._id,
      });
      await goto(`/checkout/${encodeURIComponent(result.reference)}`);
    } catch (e) {
      error = e instanceof Error ? e.message : "Could not update subscription.";
    } finally {
      busy = false;
    }
  }
  async function cancel() {
    busy = true;
    error = "";
    try {
      await runMutation(api.subscriptions.cancel, {});
    } catch (e) {
      error = e instanceof Error ? e.message : "Could not cancel.";
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head
  ><title>{$adkT("Manage subscription")} | Aliko Diamond Key</title
  ></svelte:head
>
<main class="theme-surface theme-text mx-auto max-w-3xl p-6 space-y-5">
  <h1 class="text-3xl font-bold">{$adkT("Manage subscription")}</h1>
  <a class="underline" href="/dashboard/account">{$adkT("Account settings")}</a>
  {#if $subscriptions}
    <p role="status">
      {$adkT(
        $subscriptions.access.allowed
          ? "Manager access is active."
          : $subscriptions.access.reason,
      )}
    </p>
    {#each $subscriptions.subscriptions as subscription}
      <article class="rounded-xl border p-4 space-y-2">
        <h2 class="font-semibold">{$adkT(subscription.plan)}</h2>
        <p>
          {$adkT(subscription.status)} · {new Date(
            subscription.endsAt,
          ).toLocaleDateString()}
        </p>
        {#if subscription.cancelAtPeriodEnd}<p>
            {$adkT(
              "Renewal cancelled. Access continues until the paid period ends.",
            )}
          </p>{/if}
      </article>
    {/each}
    {#if $enrollments?.managers.length}
      <label class="block" for="manager-plan">{$adkT("Plan")}</label>
      <select
        id="manager-plan"
        bind:value={plan}
        class="theme-input w-full rounded-lg border p-3"
      >
        {#each Object.entries($subscriptions.plans) as [key, value]}<option
            value={key}
            >{key} — ₦{value.monthlyFeeNgn.toLocaleString()} / {$adkT("month")} ·
            {value.propertyLimit}
            {$adkT("properties")}</option
          >{/each}
      </select>
      <button
        class="btn-primary min-h-[44px] px-4"
        disabled={busy || $subscriptions.access.allowed}
        on:click={renew}>{$adkT("Continue to checkout")}</button
      >
      {#if $subscriptions.access.allowed}<button
          class="rounded-lg border p-3 min-h-[44px]"
          disabled={busy}
          on:click={cancel}>{$adkT("Cancel renewal")}</button
        >{/if}
    {:else}<p>
        {$adkT(
          "Buyer and approved agent features do not require a manager subscription.",
        )}
      </p>{/if}
  {:else}<p>{$adkT("Loading…")}</p>{/if}
  {#if error}<p role="alert">{$adkT(error)}</p>{/if}
</main>
