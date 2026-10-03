<script lang="ts">
  import PasswordField from "$lib/components/auth/PasswordField.svelte";
  import { api } from "$lib/convex/_generated/api";
  import { useQuery, runMutation, runAction } from "$lib/convex/queries";
  import { goto } from "$app/navigation";
  const profile = useQuery(api.users.getMyProfile, {});
  let name = "",
    phone = "",
    address = "",
    email = "",
    password = "",
    code = "",
    error = "",
    message = "",
    busy = false,
    initialized = false;
  $: if ($profile && !initialized) {
    name = $profile.name;
    phone = $profile.phone ?? "";
    address = $profile.address ?? "";
    initialized = true;
  }
  async function save() {
    busy = true;
    error = "";
    try {
      await runMutation(api.users.updateMyProfile, { name, phone, address });
      message = "Profile saved.";
    } catch (e) {
      error = e instanceof Error ? e.message : "Could not save";
    } finally {
      busy = false;
    }
  }
  async function request() {
    busy = true;
    error = "";
    try {
      await runAction(api.accountSecurity.requestEmailChange, {
        email,
        password,
      });
      password = "";
      message = "Check your new email for the verification code.";
    } catch (e) {
      error = e instanceof Error ? e.message : "Could not send";
    } finally {
      busy = false;
    }
  }
  async function confirm() {
    busy = true;
    error = "";
    try {
      await runAction(api.accountSecurity.confirmEmailChange, { code });
      await runAction(api.auth.signOut, {});
      await goto("/auth?tab=signin", { invalidateAll: true });
    } catch (e) {
      error = e instanceof Error ? e.message : "Could not verify";
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>Account settings | Aliko Diamond Key</title></svelte:head>
<main class="theme-text container mx-auto max-w-2xl px-4 pt-28 pb-12 space-y-6">
  <h1 class="text-3xl font-semibold">Account settings</h1>
  <a href="/dashboard/messages" class="underline">Your conversations</a
  >{#if error}<p role="alert">{error}</p>{/if}{#if message}<p role="status">
      {message}
    </p>{/if}
  <form
    on:submit|preventDefault={save}
    class="theme-surface border rounded-xl p-5 space-y-4"
  >
    <h2 class="text-xl">Profile</h2>
    <label class="block"
      >Name<input
        required
        maxlength="120"
        bind:value={name}
        class="theme-input block w-full border rounded p-3"
      /></label
    ><label class="block"
      >Phone<input
        maxlength="80"
        bind:value={phone}
        class="theme-input block w-full border rounded p-3"
      /></label
    ><label class="block"
      >Legal address<textarea
        maxlength="500"
        bind:value={address}
        class="theme-input block w-full border rounded p-3"
      ></textarea></label
    ><button
      disabled={busy}
      class="bg-emerald-700 text-white rounded p-3 min-h-[44px]"
      >Save profile</button
    >
  </form>
  <section class="theme-surface border rounded-xl p-5 space-y-4">
    <h2 class="text-xl">Change sign-in email</h2>
    <p>
      Confirm your password and verify your new email address. All sessions are
      revoked when the change completes.
    </p>
    <form on:submit|preventDefault={request} class="space-y-3">
      <label class="block"
        >New email<input
          type="email"
          required
          maxlength="254"
          bind:value={email}
          class="theme-input block w-full border rounded p-3"
        /></label
      ><label class="block"
        >Current password<PasswordField
          strength={true}
          autocomplete="current-password"
          required
          bind:value={password}
          class="theme-input block w-full border rounded p-3"
        /></label
      ><button disabled={busy} class="border rounded p-3 min-h-[44px]"
        >Send verification code</button
      >
    </form>
    <form on:submit|preventDefault={confirm} class="space-y-3">
      <label class="block"
        >Verification code<input
          required
          bind:value={code}
          class="theme-input block w-full border rounded p-3"
        /></label
      ><button disabled={busy} class="border rounded p-3 min-h-[44px]"
        >Confirm email change</button
      >
    </form>
  </section>
</main>
