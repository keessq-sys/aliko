<script lang="ts">
  import { api } from "$lib/convex/_generated/api";
  import { useQuery, runMutation } from "$lib/convex/queries";
  import { goto } from "$app/navigation";
  const status = useQuery(api.adminSecurity.status, {});
  let secret = "";
  let code = "";
  let error = "";
  let busy = false;
  async function enroll() {
    try {
      secret = (await runMutation(api.adminSecurity.beginEnrollment, {}))
        .secret;
    } catch (e) {
      error = e instanceof Error ? e.message : "Could not enroll";
    }
  }
  async function verify() {
    busy = true;
    try {
      await runMutation(api.adminSecurity.verify, { code });
      await goto("/admin", { invalidateAll: true });
    } catch (e) {
      error = e instanceof Error ? e.message : "Verification failed";
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head
  ><title>Administrator verification — Aliko Diamond Key</title></svelte:head
>
<main class="theme-surface mx-auto my-16 max-w-lg rounded-2xl border p-8">
  <h1 class="theme-text text-2xl font-bold">Administrator verification</h1>
  <p class="my-4">
    Use your authenticator app to verify this session. Access to the admin
    console requires this additional check.
  </p>
  {#if $status && !$status.enrolled}<button
      class="min-h-[44px] rounded-lg bg-emerald-600 p-3 text-white"
      on:click={enroll}>Set up an authenticator</button
    >{/if}{#if secret}<p class="my-4">
      Add a time-based account in your authenticator using this secret. Store it
      securely.
    </p>
    <code class="block break-all rounded-lg border p-3">{secret}</code>{/if}
  <form class="my-5 space-y-4" on:submit|preventDefault={verify}>
    <label class="block"
      >Six-digit code<input
        class="theme-input mt-2 w-full rounded-lg border p-3"
        inputmode="numeric"
        autocomplete="one-time-code"
        pattern="[0-9]{6}"
        maxlength="6"
        required
        bind:value={code}
      /></label
    ><button
      disabled={busy}
      class="min-h-[44px] rounded-lg bg-emerald-600 p-3 text-white"
      >Verify and continue</button
    >
  </form>
  {#if error}<p role="alert" class="text-rose-600">{error}</p>{/if}
  <p class="text-sm">
    If you lose your authenticator, contact the designated security operator.
    Recovery requires identity verification and a recorded operator reset.
  </p>
</main>
