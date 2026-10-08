<script lang="ts">
  import { getI18n } from "$lib/i18n";
  const { locale: adkLocale } = getI18n();
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();
  import EnrolmentAccountFields from "$lib/components/auth/EnrolmentAccountFields.svelte";
  import { completeEnrolment } from "$lib/auth/enrolment";
  import { passwordProblem } from "../../../../convex/lib/passwordPolicy";
  import { ninProblem } from "../../../../convex/lib/nin";
  import { onMount } from "svelte";
  let ready = false,
    submissionKey = "",
    accountReady = false;
  let password = "",
    nin = "",
    consent = false,
    terms = false,
    existingAccount = false;
  onMount(() => {
    submissionKey = crypto.randomUUID();
    ready = true;
  });
  const planFees = useQuery(api.checkout.managerPlans, {});
  import { NIGERIAN_STATES } from "../../../../convex/lib/nigeriaLocations";
  import NigeriaLocationFields from "$lib/components/ui/NigeriaLocationFields.svelte";
  import IdentityStatus from "$lib/components/auth/IdentityStatus.svelte";
  const identity = useQuery(api.identity.status, {});
  let operationState = "",
    operationLga = "";

  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { useQuery } from "$lib/convex/queries";
  const account = useQuery(api.users.getMyProfile, {});
  let seededAccount = false;
  import {
    Building2,
    CheckCircle,
    Shield,
    ArrowRight,
    Loader2,
    MapPin,
  } from "lucide-svelte";
  import { fade } from "svelte/transition";
  import { api } from "$lib/convex/_generated/api";

  const PLANS = [
    {
      id: "starter",
      name: "Starter",
      price: "₦25,000/mo",
      features: ["Up to 10 properties", "1 manager seat", "Basic analytics"],
    },
    {
      id: "professional",
      name: "Professional",
      price: "₦75,000/mo",
      features: [
        "Up to 100 properties",
        "10 seats",
        "Advanced analytics",
        "Agent management",
      ],
      recommended: true,
    },
  ];

  let selectedPlan = "professional";
  let companyName = "";
  let contactName = "";
  let email = "";
  let phone = "";
  let companyAddress = "";
  let cacRcNumber = "";
  let portfolioSize = "11-50";
  let states: string[] = [];

  $: if ($account && !seededAccount) {
    contactName ||= $account.name;
    email ||= $account.email;
    phone ||= $account.phone ?? $account.whatsapp ?? "";
    companyAddress ||= $account.address ?? "";
    companyName ||=
      $account.companyName ?? $page.url.searchParams.get("company") ?? "";
    operationState ||= $account.operatingState ?? "";
    operationLga ||= $account.operatingLga ?? "";
    seededAccount = true;
  }
  let submitting = false;
  let submitError = "";

  const submitForm = async () => {
    submitError = "";
    if (
      !companyName.trim() ||
      !contactName.trim() ||
      !email.trim() ||
      !phone.trim()
    ) {
      submitError = "Company, contact name, email and phone are required.";
      return;
    }
    if ($account && $identity === null) {
      submitError =
        "Submit your NIN and consent before professional enrolment.";
      return;
    }
    if (!operationState || !operationLga) {
      submitError = "Select your operating state and LGA.";
      return;
    }
    if (companyAddress.trim().length < 10) {
      submitError = "Provide your full legal address before checkout.";
      return;
    }
    if (!$account && !accountReady) {
      const problem = existingAccount
        ? !password
          ? "Password is required"
          : ""
        : passwordProblem(password) ||
          ninProblem(nin) ||
          (!consent || !terms
            ? "Accept the terms and NIN consent before registration."
            : "");
      if (problem) {
        submitError = problem;
        return;
      }
    }
    submitting = true;
    try {
      const application = {
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: companyAddress.trim(),
        cacRcNumber: cacRcNumber.trim() || undefined,
        statesOfOperation: [operationState],
        operatingState: operationState,
        operatingLga: operationLga,
        portfolioSize,
        plan: selectedPlan.toUpperCase() as "STARTER" | "PROFESSIONAL",
      };
      const result = await completeEnrolment({
        kind: "MANAGER",
        submissionKey,
        application,
        registration: {
          flow: existingAccount ? "signIn" : "signUp",
          password,
          nin,
          acceptKycConsent: consent,
          acceptPolicies: terms,
        },
      });
      if (result.accountReady) {
        accountReady = true;
        password = "";
        nin = "";
      }
      if (!result.ok) throw new Error(result.error);
      await goto(result.redirect, { invalidateAll: true });
    } catch (err: any) {
      submitError = err?.message ?? "Submission failed. Please try again.";
    } finally {
      submitting = false;
    }
  };
</script>

<svelte:head
  ><title>{$adkT("Register as an Estate Manager — Aliko Diamond Key")}</title
  ></svelte:head
>

<div
  class="min-h-screen bg-[#050A0E] text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative"
>
  <div
    class="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none"
  ></div>

  <div class="max-w-4xl mx-auto">
    <div class="text-center mb-10">
      <h1 class="text-3xl sm:text-4xl font-bold mb-2">
        {$adkT("Estate Manager Enrolment")}
      </h1>
      <p class="text-gray-400">
        {$adkT(
          "Manage your portfolio, tenants and agents on the ADK platform.",
        )}
      </p>
    </div>

    <div
      class="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl"
    >
      <h2 class="text-xl font-bold text-blue-400 mb-6 flex items-center gap-2">
        <Building2 class="w-5 h-5" />
        {$adkT("Company Details")}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <label class="block">
          <span class="mb-1 block text-sm text-gray-400"
            >{$adkT("Company Name *")}</span
          >
          <input
            dir="auto"
            type="text"
            autocomplete="organization"
            bind:value={companyName}
            class="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500"
            placeholder={$adkT("ADK Estates Ltd")}
          />
        </label>
        <label class="block">
          <span class="mb-1 block text-sm text-gray-400"
            >{$adkT("Contact Person *")}</span
          >
          <input
            dir="auto"
            type="text"
            autocomplete="name"
            bind:value={contactName}
            class="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500"
            placeholder={$adkT("Chidi Nwosu")}
          />
        </label>
        <label class="block">
          <span class="mb-1 block text-sm text-gray-400"
            >{$adkT("Corporate Email *")}</span
          >
          <input
            dir="auto"
            type="email"
            inputmode="email"
            autocomplete="email"
            bind:value={email}
            class="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500"
            placeholder={$adkT("manager@company.com")}
          />
        </label>
        <label class="block">
          <span class="mb-1 block text-sm text-gray-400"
            >{$adkT("Phone Number *")}</span
          >
          <input
            dir="auto"
            type="tel"
            inputmode="tel"
            autocomplete="tel-national"
            bind:value={phone}
            class="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500"
            placeholder="801 234 5678"
          />
        </label>
        <label class="block">
          <span class="mb-1 block text-sm text-gray-400"
            >{$adkT("CAC / RC Number")}</span
          >
          <input
            dir="auto"
            type="text"
            bind:value={cacRcNumber}
            class="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500"
            placeholder={$adkT("Optional")}
          />
        </label>
        <label class="block">
          <span class="mb-1 block text-sm text-gray-400"
            >{$adkT("Portfolio Size")}</span
          >
          <select
            bind:value={portfolioSize}
            class="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500"
          >
            <option>1-10</option><option>11-50</option><option>50+</option>
          </select>
        </label>
      </div>

      <label class="block mt-6">
        <span class="mb-1 block text-sm text-gray-400"
          >{$adkT("Company / legal address")}</span
        >
        <input
          dir="auto"
            autocomplete="street-address"
          bind:value={companyAddress}
          required
          class="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500"
        />
      </label>
      <div class="mt-6">
        <NigeriaLocationFields
          bind:state={operationState}
          bind:lga={operationLga}
          required
        />
      </div>
      {#if $account || accountReady}<div class="mt-6">
          <IdentityStatus />
        </div>{:else}
        <EnrolmentAccountFields
          bind:password
          bind:nin
          bind:consent
          bind:terms
          bind:existingAccount
        />
        <p class="text-sm text-stone-400">
          {$adkT(
            "Your phone number will also be used as your WhatsApp contact.",
          )}
        </p>
      {/if}

      <h2 class="mt-10 text-xl font-bold text-blue-400 mb-4">
        {$adkT("Choose Your Plan")}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each PLANS as plan}
          <button
            type="button"
            on:click={() => (selectedPlan = plan.id)}
            class="rounded-2xl border p-5 text-left transition-all {selectedPlan ===
            plan.id
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-white/10 bg-black/20 hover:border-white/30'}"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="font-bold text-white">{$adkT(plan.name)}</span>
              {#if plan.recommended}<span
                  class="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300"
                  >{$adkT("POPULAR")}</span
                >{/if}
            </div>
            <p class="text-lg font-bold text-blue-400">
              ₦{(
                $planFees?.[
                  plan.id.toUpperCase() as "STARTER" | "PROFESSIONAL"
                ] ?? (plan.id === "starter" ? 25000 : 75000)
              ).toLocaleString($adkLocale === "ar" ? "ar-NG" : "en-NG")}/{$adkT(
                "month",
              )}
            </p>
            <ul class="mt-3 space-y-1.5">
              {#each plan.features as f}
                <li class="flex items-center gap-2 text-xs text-stone-400">
                  <CheckCircle size={12} class="text-blue-400" />
                  {$adkT(f)}
                </li>
              {/each}
            </ul>
          </button>
        {/each}
      </div>

      {#if submitError}
        <p
          class="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300"
        >
          {$adkT(submitError)}
        </p>
      {/if}

      <div class="mt-8 flex justify-end">
        <button
          on:click={submitForm}
          disabled={submitting || !ready}
          class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 px-8 py-3 font-medium text-white shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
        >
          {#if submitting}
            <Loader2 class="w-4 h-4 animate-spin" />
            {$adkT("Submitting…")}{:else}{$adkT("Submit Enrolment")}
            <ArrowRight class="w-4 h-4" />
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>
