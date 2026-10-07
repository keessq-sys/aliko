<script lang="ts">
  import InteractiveFields from "$lib/components/ui/InteractiveFields.svelte";
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();

  import NigeriaLocationFields from "$lib/components/ui/NigeriaLocationFields.svelte";
  let operatingState = "",
    operatingLga = "";
  import NinField from "./NinField.svelte";
  import { ninProblem } from "../../../../convex/lib/nin";
  let whatsapp = "";
  let nin = "",
    acceptKycConsent = false;
  import PasswordField from "$lib/components/auth/PasswordField.svelte";
  import { passwordProblem } from "../../../../convex/lib/passwordPolicy";
  import { Mail, Lock, User, Loader2, CheckCircle2 } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import { api } from "$lib/convex/_generated/api";
  import { runAction } from "$lib/convex/queries";

  let fullName = "";
  let email = "";
  let password = "";
  let confirmPassword = "";
  let isDiaspora = false;
  let customerKind: "BUYER" | "RENTER" = "BUYER";
  let terms = false;
  let loading = false;
  let errorMessage = "";

  let errors: Record<string, string> = {};

  const signUp = async (args: any) => runAction(api.auth.signIn, args);

  const validate = () => {
    errors = {};
    if (!fullName.trim()) errors.fullName = "Full name is required";
    if (!email) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Email is invalid";
    if (!password) errors.password = "Password is required";
    else if (passwordProblem(password))
      errors.password = passwordProblem(password)!;
    if (password !== confirmPassword)
      errors.confirmPassword = "Passwords do not match";
    if (ninProblem(nin)) errors.nin = ninProblem(nin)!;
    if (!acceptKycConsent)
      errors.nin = "Accept the NIN verification consent before registration.";
    if (!/^\+?[0-9]{10,15}$/.test(whatsapp.replace(/[\s()-]/g, "")))
      errors.whatsapp = "Provide a valid WhatsApp phone number.";
    if (!operatingState || !operatingLga)
      errors.location = "Select your state and LGA.";
    if (!terms) errors.terms = "You must accept the terms";
    return Object.keys(errors).length === 0;
  };

  async function handleSubmit() {
    errorMessage = "";
    if (!validate()) return;
    loading = true;
    try {
      await signUp({
        provider: "password",
        params: {
          flow: "signUp",
          nin,
          whatsapp,
          operatingState,
          operatingLga,
          acceptKycConsent,
          acceptPolicies: terms,
          policyVersion: "2026-10-03",
          email: email.trim().toLowerCase(),
          password,
          name: fullName.trim(),
          role: "CLIENT",
          isDiaspora,
          customerKind,
        },
      } as any);
      if (typeof window !== "undefined")
        localStorage.setItem("adk-role", "CLIENT");
      await goto("/dashboard/client", { invalidateAll: true });
    } catch (err: any) {
      errorMessage = err?.message ?? "Sign-up failed. Please try again.";
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-5">
  <InteractiveFields
    spacing="space-y-5"
    busy={loading}
    label={$adkT("Register")}
  >
    <label class="block theme-text"
      >{$adkT("Account type")}<select
        bind:value={customerKind}
        class="theme-input block w-full border rounded-lg p-3"
        ><option value="BUYER">{$adkT("Buyer")}</option><option value="RENTER"
          >{$adkT("Renter")}</option
        ></select
      ></label
    >
    <label class="block theme-text text-sm"
      >{$adkT("WhatsApp contact")}<input
        type="tel"
        required
        bind:value={whatsapp}
        class="theme-input block w-full min-h-[44px] rounded-lg border p-3"
      /></label
    >
    <NigeriaLocationFields
      bind:state={operatingState}
      bind:lga={operatingLga}
      required
    />
    <NinField
      bind:nin
      bind:consent={acceptKycConsent}
      error={errors.nin ?? ""}
    />
    <label class="block">
      <span class="mb-1 block text-sm font-medium text-gray-300"
        >{$adkT("Full Name")}</span
      >
      <div class="relative">
        <div
          class="pointer-events-none absolute top-0 h-[44px] left-0 flex items-center pl-3"
        >
          <User class="h-5 w-5 text-gray-400" />
        </div>
        <input
          dir="auto"
          type="text"
          autocomplete="name"
          bind:value={fullName}
          class="block w-full rounded-lg border {errors.fullName
            ? 'border-red-500'
            : 'border-white/10 focus:ring-emerald-500'} bg-black/20 min-h-[44px] py-2.5 pl-10 pr-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all focus:ring-1"
          placeholder={$adkT("Amara Eze")}
        />
      </div>
      {#if errors.fullName}<p class="mt-1 text-sm text-red-400">
          {errors.fullName}
        </p>{/if}
    </label>

    <label class="block">
      <span class="mb-1 block text-sm font-medium text-gray-300"
        >{$adkT("Email Address")}</span
      >
      <div class="relative">
        <div
          class="pointer-events-none absolute top-0 h-[44px] left-0 flex items-center pl-3"
        >
          <Mail class="h-5 w-5 text-gray-400" />
        </div>
        <input
          dir="auto"
          type="email"
          inputmode="email"
          autocomplete="email"
          bind:value={email}
          class="block w-full rounded-lg border {errors.email
            ? 'border-red-500'
            : 'border-white/10 focus:ring-emerald-500'} bg-black/20 min-h-[44px] py-2.5 pl-10 pr-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all focus:ring-1"
          placeholder={$adkT("you@example.com")}
        />
      </div>
      {#if errors.email}<p class="mt-1 text-sm text-red-400">
          {errors.email}
        </p>{/if}
    </label>

    <div class="grid grid-cols-2 gap-4">
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-gray-300"
          >{$adkT("Password")}</span
        >
        <div class="relative">
          <div
            class="pointer-events-none absolute top-0 h-[44px] left-0 flex items-center pl-3"
          >
            <Lock class="h-5 w-5 text-gray-400" />
          </div>
          <PasswordField
            strength={true}
            autocomplete="new-password"
            bind:value={password}
            class="block w-full rounded-lg border {errors.password
              ? 'border-red-500'
              : 'border-white/10'} bg-black/20 min-h-[44px] py-2.5 pl-10 pr-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all"
            placeholder="••••••••"
          />
        </div>
        {#if errors.password}<p class="mt-1 text-xs text-red-400">
            {errors.password}
          </p>{/if}
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-gray-300"
          >{$adkT("Confirm")}</span
        >
        <PasswordField
          autocomplete="new-password"
          bind:value={confirmPassword}
          class="block w-full rounded-lg border {errors.confirmPassword
            ? 'border-red-500'
            : 'border-white/10'} bg-black/20 min-h-[44px] px-3 py-2.5 text-white placeholder-gray-400 backdrop-blur-sm transition-all"
          placeholder="••••••••"
        />
        {#if errors.confirmPassword}<p class="mt-1 text-xs text-red-400">
            {$adkT(errors.confirmPassword)}
          </p>{/if}
      </label>
    </div>

    <label class="flex items-center gap-2 text-sm text-gray-300">
      <input
        dir="auto"
        type="checkbox"
        bind:checked={isDiaspora}
        class="h-4 w-4 rounded border-gray-600 bg-black/20 text-emerald-500 focus:ring-emerald-500"
      />
      {$adkT("I am in the diaspora (outside Nigeria)")}
    </label>

    <label class="flex items-start gap-2 text-sm text-gray-300">
      <input
        dir="auto"
        type="checkbox"
        bind:checked={terms}
        class="mt-0.5 h-4 w-4 rounded border-gray-600 bg-black/20 text-emerald-500 focus:ring-emerald-500"
      />
      <span
        >{$adkT("I agree to the")}
        <a href="/legal/terms" class="underline hover:text-white"
          >{$adkT("Terms of Service")}</a
        >
        {$adkT("and")}
        <a href="/legal/privacy" class="underline hover:text-white"
          >{$adkT("Privacy Policy")}</a
        ></span
      >
    </label>
    {#if errors.terms}<p class="text-sm text-red-400">
        {$adkT(errors.terms)}
      </p>{/if}

    {#if errorMessage}
      <p
        class="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300"
      >
        {$adkT(errorMessage)}
      </p>
    {/if}

    <button
      type="submit"
      disabled={loading}
      class="flex w-full justify-center rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-400 py-3 px-4 text-sm font-medium text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {#if loading}
        <Loader2 class="mr-2 h-5 w-5 animate-spin" />
        {$adkT("Creating account…")}{:else}
        <CheckCircle2 class="mr-2 h-5 w-5" />
        {$adkT("Create Buyer/Renter Account")}{/if}
    </button>
  </InteractiveFields>
</form>
