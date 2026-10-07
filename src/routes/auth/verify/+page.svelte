<script lang="ts">
  import { page } from "$app/stores";
  import { getTranslation } from "$lib/i18n";
  import { api } from "$lib/convex/_generated/api";
  import { runMutation } from "$lib/convex/queries";
  const adkT = getTranslation();
  let error = "",
    verified = false,
    busy = false;
  async function confirm() {
    busy = true;
    error = "";
    try {
      await runMutation(api.emailVerification.confirm, {
        token: $page.url.searchParams.get("token") ?? "",
      });
      verified = true;
      history.replaceState({}, "", "/auth/verify");
    } catch (e) {
      error = e instanceof Error ? e.message : "Verification failed.";
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head
  ><title>{$adkT("Verify email")} | Aliko Diamond Key</title><meta
    name="robots"
    content="noindex,nofollow"
  /><meta name="referrer" content="no-referrer" /></svelte:head
>
<main class="theme-surface theme-text mx-auto max-w-xl p-8 space-y-5">
  <h1 class="text-3xl font-bold">{$adkT("Verify email")}</h1>
  {#if verified}<p role="status">
      {$adkT("Your email is verified. You can sign in to your account.")}
    </p>
    <a class="btn-primary inline-block p-3" href="/admin-login"
      >{$adkT("Admin Login")}</a
    ><a class="underline block" href="/auth?tab=signin">{$adkT("Sign In")}</a>
  {:else}<p>{$adkT("Confirm that this email address belongs to you.")}</p>
    <button
      disabled={busy}
      class="btn-primary min-h-[44px] px-4"
      on:click={confirm}>{$adkT("Verify email")}</button
    >{/if}
  {#if error}<p role="alert">{$adkT(error)}</p>{/if}
</main>
