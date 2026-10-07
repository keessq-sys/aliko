<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();

  import IdentityStatus from "$lib/components/auth/IdentityStatus.svelte";
  import PasswordField from "$lib/components/auth/PasswordField.svelte";
  import { api } from "$lib/convex/_generated/api";
  import { useQuery, runMutation, runAction } from "$lib/convex/queries";
  import { goto } from "$app/navigation";
  import NigeriaLocationFields from "$lib/components/ui/NigeriaLocationFields.svelte";
  let operatingState = "",
    operatingLga = "",
    whatsapp = "";
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
    operatingState = $profile.operatingState ?? "";
    operatingLga = $profile.operatingLga ?? "";
    whatsapp = $profile.whatsapp ?? "";
    initialized = true;
  }
  async function save() {
    busy = true;
    error = "";
    try {
      await runMutation(api.users.updateMyProfile, {
        name,
        phone,
        address,
        whatsapp,
        operatingState,
        operatingLga,
      });
      message = "Profile saved.";
    } catch (e) {
      error = e instanceof Error ? e.message : "Could not save";
    } finally {
      busy = false;
    }
  }
  async function verifyEmail() {
    busy = true; error = "";
    try { await runAction(api.emailVerification.request, {}); message = "Verification email accepted. Check your inbox and follow the link."; }
    catch(e) { error = e instanceof Error ? e.message : "Could not send verification email."; }
    finally { busy = false; }
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

<svelte:head
  ><title>{$adkT("Account settings | Aliko Diamond Key")}</title></svelte:head
>
<main class="theme-text container mx-auto max-w-2xl px-4 pt-28 pb-12 space-y-6">
  <h1 class="text-3xl font-semibold">{$adkT("Account settings")}</h1>
  <IdentityStatus />
  {#if $profile && !$profile.emailVerificationTime}<button class="rounded-lg border p-3 min-h-[44px]" disabled={busy} on:click={verifyEmail}>{$adkT("Send verification email")}</button>{/if}
  <a href="/dashboard/subscriptions" class="underline"
    >{$adkT("Manage subscription")}</a
  >
  <a href="/dashboard/messages" class="underline"
    >{$adkT("Your conversations")}</a
  >{#if error}<p role="alert">{$adkT(error)}</p>{/if}{#if message}<p
      role="status"
    >
      {$adkT(message)}
    </p>{/if}
  <form
    on:submit|preventDefault={save}
    class="theme-surface border rounded-xl p-5 space-y-4"
  >
    <h2 class="text-xl">{$adkT("Profile")}</h2>
    <NigeriaLocationFields
      bind:state={operatingState}
      bind:lga={operatingLga}
    />
    <label class="block"
      >{$adkT("WhatsApp contact")}<input
        type="tel"
        required
        bind:value={whatsapp}
        class="theme-input block w-full border rounded p-3"
      /></label
    >
    <label class="block"
      >{$adkT("Name")}<input
        dir="auto"
        required
        maxlength="120"
        bind:value={name}
        class="theme-input block w-full border rounded p-3"
      /></label
    ><label class="block"
      >{$adkT("Phone")}<input
        dir="auto"
        maxlength="80"
        bind:value={phone}
        class="theme-input block w-full border rounded p-3"
      /></label
    ><label class="block"
      >{$adkT("Legal address")}<textarea
        dir="auto"
        maxlength="500"
        bind:value={address}
        class="theme-input block w-full border rounded p-3"
      ></textarea></label
    ><button
      disabled={busy}
      class="bg-emerald-700 text-white rounded p-3 min-h-[44px]"
      >{$adkT("Save profile")}</button
    >
  </form>
  <section class="theme-surface border rounded-xl p-5 space-y-4">
    <h2 class="text-xl">{$adkT("Change sign-in email")}</h2>
    <p>
      {$adkT(
        "Confirm your password and verify your new email address. All sessions are revoked when the change completes.",
      )}
    </p>
    <form on:submit|preventDefault={request} class="space-y-3">
      <label class="block"
        >{$adkT("New email")}<input
          dir="auto"
          type="email"
          required
          maxlength="254"
          bind:value={email}
          class="theme-input block w-full border rounded p-3"
        /></label
      ><label class="block"
        >{$adkT("Current password")}<PasswordField
          strength={true}
          autocomplete="current-password"
          required
          bind:value={password}
          class="theme-input block w-full border rounded p-3"
        /></label
      ><button disabled={busy} class="border rounded p-3 min-h-[44px]"
        >{$adkT("Send verification code")}</button
      >
    </form>
    <form on:submit|preventDefault={confirm} class="space-y-3">
      <label class="block"
        >{$adkT("Verification code")}<input
          dir="auto"
          required
          bind:value={code}
          class="theme-input block w-full border rounded p-3"
        /></label
      ><button disabled={busy} class="border rounded p-3 min-h-[44px]"
        >{$adkT("Confirm email change")}</button
      >
    </form>
  </section>
</main>
