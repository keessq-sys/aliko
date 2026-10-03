<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();

  import { api } from "$lib/convex/_generated/api";
  import { runAction, runMutation } from "$lib/convex/queries";
  import type { Id } from "../../../../convex/_generated/dataModel";
  export let userId: Id<"users">;
  export let name: string;
  let nin = "", reason = "", error = "", message = "", busy = false;
  async function reveal() {
    error = ""; busy = true;
    try { nin = await runAction(api.identity.reveal, { userId }); }
    catch(e) { error = e instanceof Error ? e.message : "Could not reveal NIN"; }
    finally { busy = false; }
  }
  async function review(status: "VERIFIED" | "FAILED") {
    error = ""; busy = true;
    try { await runMutation(api.identity.review, { userId, status, reason }); nin = ""; message = "Identity review saved."; }
    catch(e) { error = e instanceof Error ? e.message : "Could not save review"; }
    finally { busy = false; }
  }
</script>
<section class="theme-surface theme-text rounded-xl border p-5 mt-5 space-y-3">
  <h2 class="text-xl font-semibold">{$adkT("Identity review:")} <span dir="auto">{$adkT(name)}</span></h2>
  <p>{$adkT("Verify the submitted NIN against authorized identity evidence before approving. A recent administrator security check is required.")}</p>
  {#if error}<p role="alert">{$adkT(error)}</p>{/if}{#if message}<p role="status">{$adkT(message)}</p>{/if}
  <div class="flex gap-3 items-center">{#if nin}<bdi class="font-mono">{nin}</bdi><button class="btn-ghost" on:click={() => nin = ""}>{$adkT("Hide NIN")}</button>
    {:else}<button class="btn-ghost" disabled={busy} on:click={reveal}>{$adkT("Reveal NIN")}</button>{/if}</div>
  <label class="block">{$adkT("Verification evidence or rejection reason")}<textarea dir="auto" minlength="20" maxlength="1000" bind:value={reason} class="theme-input border rounded block w-full p-3"></textarea></label>
  <p class="text-xs">{$adkT("Do not include NIN numbers in the review notes. The account holder can read this explanation.")}</p>
  <div class="flex flex-wrap gap-3"><button class="btn-primary" disabled={busy || reason.trim().length < 20} on:click={() => review("VERIFIED")}>{$adkT("Confirm verified identity")}</button>
    <button class="btn-ghost" disabled={busy || reason.trim().length < 20} on:click={() => review("FAILED")}>{$adkT("Request correction")}</button>
    <a class="btn-ghost" href={`/admin/messages?recipient=${userId}`}>{$adkT("Message this user")}</a></div>
</section>
