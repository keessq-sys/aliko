<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  import PasswordField from "./PasswordField.svelte";
  import NinField from "./NinField.svelte";
  const adkT = getTranslation();
  export let password = "";
  export let nin = "";
  export let consent = false;
  export let terms = false;
  export let existingAccount = false;
</script>

<section class="my-6 space-y-4 rounded-xl border border-white/10 p-4">
  <h2 class="font-semibold theme-text">{$adkT("Account access")}</h2>
  <p class="text-sm text-stone-400">
    {$adkT(
      "Your enrolment details also create your account. You do not need to complete another signup form.",
    )}
  </p>
  <label class="flex items-center gap-3 text-sm theme-text">
    <input type="checkbox" bind:checked={existingAccount} />
    {$adkT("I already have an account")}
  </label>
  <label class="block theme-text">
    <span class="mb-1 block text-sm">{$adkT("Password")}</span>
    <PasswordField
      bind:value={password}
      strength={!existingAccount}
      autocomplete={existingAccount ? "current-password" : "new-password"}
      required
    />
  </label>
  {#if !existingAccount}
    <NinField bind:nin bind:consent />
    <label class="flex items-start gap-3 text-sm theme-text">
      <input type="checkbox" bind:checked={terms} required class="mt-1" />
      <span
        >{$adkT("I agree to the")}
        <a class="underline" href="/legal/terms">{$adkT("Terms of Service")}</a>
        {$adkT("and")}
        <a class="underline" href="/legal/privacy">{$adkT("Privacy Policy")}</a
        >.</span
      >
    </label>
  {/if}
</section>
