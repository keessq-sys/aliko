<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();

  import { normalizeNin } from "../../../../convex/lib/nin";
  $: valid = /^\d{11}$/.test(normalizeNin(nin));
  $: progress = Math.min(normalizeNin(nin).replace(/\D/g, "").length, 11);
  export let nin = "";
  export let consent = false;
  export let error = "";
</script>

<div class="space-y-3">
  <label class="block">
    <span class="mb-1 block text-sm font-medium theme-text"
      >{$adkT("National Identification Number (NIN)")}</span
    >
    <input
      name="nin"
      required
      inputmode="numeric"
      autocomplete="off"
      maxlength="11"
      dir="ltr"
      bind:value={nin}
      class="theme-input min-h-[44px] w-full rounded-lg border p-3"
      placeholder={$adkT("11-digit NIN")}
      aria-describedby="nin-help"
    />
  </label>
  <div
    role="progressbar"
    aria-label={$adkT("NIN format")}
    aria-valuemin="0"
    aria-valuemax="11"
    aria-valuenow={progress}
    class="h-2 overflow-hidden rounded-full bg-stone-200"
  >
    <div
      class="h-full bg-emerald-600 transition-all"
      style:width={`${(progress / 11) * 100}%`}
    ></div>
  </div>
  {#if valid}<p
      class="text-emerald-700 dark:text-emerald-300 text-sm font-semibold"
    >
      ✓ {$adkT("11-digit format complete")}
    </p>{/if}
  <p id="nin-help" class="text-xs theme-text">
    {$adkT(
      "Your NIN is encrypted. The green tick confirms 11 digits only; it does not verify your identity with a government authority.",
    )}
  </p>
  <label class="flex items-start gap-3 text-sm theme-text">
    <input
      dir="auto"
      type="checkbox"
      required
      bind:checked={consent}
      class="mt-1 h-4 w-4"
    />
    <span
      >{$adkT(
        "I consent to NIN collection and identity verification under the",
      )}
      <a class="underline" href="/legal/kyc-consent"
        >{$adkT("KYC consent notice")}</a
      >.</span
    >
  </label>
  {#if error}<p role="alert" class="text-sm text-rose-500">
      {$adkT(error)}
    </p>{/if}
</div>
