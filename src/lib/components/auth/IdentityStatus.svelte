<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();

  import { api } from "$lib/convex/_generated/api";
  import { useQuery, runAction } from "$lib/convex/queries";
  import NinField from "./NinField.svelte";
  const identity = useQuery(api.identity.status, {});
  let nin = "", consent = false, error = "", busy = false;
  async function submit() {
    busy = true; error = "";
    try { await runAction(api.identity.submit, { nin, consent }); nin = ""; }
    catch (e) { error = e instanceof Error ? e.message : "Could not submit identity"; }
    finally { busy = false; }
  }
</script>
<section class="theme-surface theme-text rounded-xl border p-5 space-y-3">
  <h2 class="text-xl font-semibold">{$adkT("Identity verification")}</h2>
  {#if $identity === undefined}<p>{$adkT("Loading identity status…")}</p>
  {:else if $identity}<p>{$adkT("NIN:")} <bdi>{$adkT($identity.maskedNin)}</bdi> · {$adkT($identity.status)}</p>
    {#if $identity.status === "PENDING"}<p>{$adkT("Your identity is awaiting verification. Payment and professional account approval require verified identity.")}</p>{/if}
    {#if $identity.reviewReason}<p dir="auto">{$adkT($identity.reviewReason)}</p>{/if}
  {/if}
  {#if $identity !== undefined && (!$identity || $identity.status === "FAILED")}
    <form on:submit|preventDefault={submit} class="space-y-3">
      <NinField bind:nin bind:consent {error} />
      <button disabled={busy} class="btn-primary">{$adkT("Submit NIN for verification")}</button>
    </form>
  {/if}
</section>
