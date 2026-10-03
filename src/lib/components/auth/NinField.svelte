<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();

  export let nin = "";
  export let consent = false;
  export let error = "";
</script>

<div class="space-y-3">
  <label class="block">
    <span class="mb-1 block text-sm font-medium theme-text">{$adkT("National Identification Number (NIN)")}</span>
    <input name="nin" required inputmode="numeric" autocomplete="off" maxlength="11"
      dir="ltr" bind:value={nin} class="theme-input min-h-[44px] w-full rounded-lg border p-3"
      placeholder={$adkT("11-digit NIN")} aria-describedby="nin-help" />
  </label>
  <p id="nin-help" class="text-xs theme-text">{$adkT("Your NIN is encrypted and visible only to the super administrator for identity verification. Submission does not mean verification is complete.")}</p>
  <label class="flex items-start gap-3 text-sm theme-text">
    <input dir="auto" type="checkbox" required bind:checked={consent} class="mt-1 h-4 w-4" />
    <span>{$adkT("I consent to NIN collection and identity verification under the")} <a class="underline" href="/legal/kyc-consent">{$adkT("KYC consent notice")}</a>.</span>
  </label>
  {#if error}<p role="alert" class="text-sm text-rose-500">{$adkT(error)}</p>{/if}
</div>
