<script lang="ts">
  import LoginForm from "$lib/components/auth/LoginForm.svelte";
  import ForgotPasswordForm from "$lib/components/auth/ForgotPasswordForm.svelte";
  let resetting = false;
</script>

<svelte:head
  ><title>Administrator sign in | Aliko Diamond Key</title><meta
    name="robots"
    content="noindex,nofollow"
  /></svelte:head
>
<section class="min-h-screen px-4 pt-32 pb-16">
  <div class="mx-auto max-w-md rounded-2xl border p-8 theme-surface theme-text">
    <h1 class="text-3xl font-bold mb-3">Administrator sign in</h1>
    <p class="mb-6 theme-muted">
      Restricted to the designated super administrator. Administrator security
      verification is required before opening the command center.
    </p>
    {#if resetting}<ForgotPasswordForm
        on:backToSignIn={() => (resetting = false)}
      />{:else}<LoginForm
        adminMode
        on:forgotPassword={() => (resetting = true)}
      />{/if}
    <a href="/" class="block mt-6 underline">Return to the website</a>
  </div>
</section>
