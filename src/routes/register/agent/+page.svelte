<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();
  import { NIGERIAN_STATES } from "../../../../convex/lib/nigeriaLocations";
  import NigeriaLocationFields from "$lib/components/ui/NigeriaLocationFields.svelte";
  import IdentityStatus from "$lib/components/auth/IdentityStatus.svelte";
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
  const identity = useQuery(api.identity.status, {});
  let operationState = "",
    operationLga = "";

  import { goto } from "$app/navigation";
  import { useQuery } from "$lib/convex/queries";
  const account = useQuery(api.users.getMyProfile, {});
  let seededAccount = false;
  import {
    User,
    MapPin,
    Briefcase,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    Loader2,
  } from "lucide-svelte";
  import { fade } from "svelte/transition";
  import { api } from "$lib/convex/_generated/api";

  let currentStep = 1;
  const totalSteps = 5;

  const SPECIALIZATIONS = [
    "Residential Sales",
    "Commercial Sales",
    "Land/Plots",
    "Rental Management",
    "Property Valuation",
    "Investment Advisory",
    "Off-plan Sales",
    "Diaspora Services",
  ];

  // Form Data
  let formData = {
    // Step 1
    fullName: "",
    dob: "",
    gender: "Male",
    nationality: "Nigeria",
    stateOfOrigin: "",

    // Step 2
    agencyName: "",
    type: "Independent Agent",
    reanNumber: "",
    niaNumber: "",
    experience: "1-3",
    specializations: [] as string[],
    bio: "",

    // Step 3
    phone: "",
    whatsappSame: true,
    whatsapp: "",
    email: "",
    address: "",
    statesOfOp: [] as string[],
    lgas: "",
    expectedListings: "1-5",

    // Step 4
    documents: {
      photo: null as File | null,
      id: null as File | null,
      license: null as File | null,
      cert: null as File | null,
    },

    // Step 5
    termsAccepted: false,
  };

  let submitting = false;
  let submitted = false;
  $: if ($account && !seededAccount) {
    formData.fullName ||= $account.name;
    formData.email ||= $account.email;
    formData.phone ||= $account.phone ?? $account.whatsapp ?? "";
    formData.agencyName ||= $account.agencyName ?? "";
    operationState ||= $account.operatingState ?? "";
    operationLga ||= $account.operatingLga ?? "";
    seededAccount = true;
  }
  let reference = "";
  let submitError = "";

  const toggleSpec = (s: string) => {
    if (formData.specializations.includes(s)) {
      formData.specializations = formData.specializations.filter(
        (x) => x !== s,
      );
    } else {
      formData.specializations = [...formData.specializations, s];
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) currentStep++;
  };
  const prevStep = () => {
    if (currentStep > 1) currentStep--;
  };

  const submitForm = async () => {
    submitError = "";
    if (!formData.fullName || !formData.email || !formData.phone) {
      submitError =
        "Name, email and phone are required. Please review earlier steps.";
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
    if (!formData.termsAccepted) {
      submitError = "Accept the application terms.";
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
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        agencyName: formData.agencyName || undefined,
        agentType: formData.type,
        reanNumber: formData.reanNumber || undefined,
        experience: formData.experience,
        specializations: formData.specializations,
        bio: formData.bio || undefined,
        statesOfOperation: [operationState],
        operatingState: operationState,
        operatingLga: operationLga,
        stateOfOrigin: formData.stateOfOrigin || undefined,
        birthDate: formData.dob || undefined,
        gender: formData.gender,
        nationality: formData.nationality,
        niaNumber: formData.niaNumber || undefined,
        whatsapp: formData.whatsappSame
          ? formData.phone
          : formData.whatsapp || undefined,
        address: formData.address || undefined,
        expectedListings: formData.expectedListings,
        primaryLgas: operationLga,
      };
      const result = await completeEnrolment({
        kind: "AGENT",
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
      reference = result.reference;
      submitted = true;
    } catch (err: any) {
      submitError = err?.message ?? "Submission failed. Please try again.";
    } finally {
      submitting = false;
    }
  };
</script>

<svelte:head
  ><title>{$adkT("Register as a Verified Agent — Aliko Diamond Key")}</title
  ></svelte:head
>

<div
  class="min-h-screen bg-[#050A0E] text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative"
>
  <!-- Background effects -->
  <div
    class="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-amber-900/20 to-transparent pointer-events-none"
  ></div>

  {#if submitted}
    <div class="max-w-2xl mx-auto mt-20 text-center" in:fade>
      <div
        class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/20 mb-8"
      >
        <CheckCircle class="h-12 w-12 text-emerald-400" />
      </div>
      <h2 class="text-4xl font-bold mb-4">
        {$adkT("Application Submitted Successfully!")}
      </h2>
      <p class="text-gray-400 text-lg mb-8">
        {$adkT("Your reference number is")}
        <span class="text-amber-400 font-bold"
          >{$adkT(reference || "ADK-AGT-2026-0000")}</span
        >
      </p>

      <div
        class="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-md mx-auto text-left"
      >
        <h3 class="font-semibold text-lg mb-4 text-emerald-400">
          {$adkT("Next Steps:")}
        </h3>
        <ul class="space-y-4 text-gray-300">
          <li class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400"
            >
              1
            </div>
            {$adkT("Review in 48hrs")}
          </li>
          <li class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400"
            >
              2
            </div>
            {$adkT("Verification Call")}
          </li>
          <li class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center text-gray-400"
            >
              3
            </div>
            {$adkT("Account Activated")}
          </li>
        </ul>
      </div>

      <a
        href="/"
        class="inline-block mt-8 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        >{$adkT("Return to Home")}</a
      >
    </div>
  {:else}
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-10">
        <h1 class="text-3xl sm:text-4xl font-bold mb-2">
          {$adkT("Join as a Verified Agent")}
        </h1>
        <p class="text-gray-400">
          {$adkT(
            "Complete your professional profile to start listing properties.",
          )}
        </p>
      </div>

      <!-- Stepper -->
      <div class="mb-12">
        <div class="flex items-center justify-between relative">
          <div
            class="absolute left-0 top-1/2 w-full h-1 bg-gray-800 -z-10 -translate-y-1/2"
          ></div>
          <div
            class="absolute left-0 top-1/2 h-1 bg-amber-500 -z-10 -translate-y-1/2 transition-all duration-500"
            style="width: {((currentStep - 1) / (totalSteps - 1)) * 100}%"
          ></div>

          {#each Array(totalSteps) as _, i}
            <div class="flex flex-col items-center gap-2">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors {currentStep >
                i + 1
                  ? 'bg-amber-500 text-black'
                  : currentStep === i + 1
                    ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                    : 'bg-gray-800 text-gray-400'}"
              >
                {#if currentStep > i + 1}
                  <CheckCircle class="w-6 h-6" />
                {:else}
                  {$adkT(i + 1)}
                {/if}
              </div>
              <span class="text-xs text-gray-400 hidden sm:block">
                {$adkT(
                  i === 0
                    ? "Personal"
                    : i === 1
                      ? "Professional"
                      : i === 2
                        ? "Coverage"
                        : i === 3
                          ? "Documents"
                          : "Review",
                )}
              </span>
            </div>
          {/each}
        </div>
      </div>

      <div
        class="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl"
      >
        {#if $account || accountReady}<IdentityStatus />{:else}
          <EnrolmentAccountFields
            bind:password
            bind:nin
            bind:consent
            bind:terms
            bind:existingAccount
          />
        {/if}
        {#if currentStep === 1}
          <div in:fade>
            <h2 class="text-2xl font-bold text-amber-400 mb-6">
              {$adkT("Personal Information")}
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="md:col-span-2 flex flex-col items-center mb-4">
                <div
                  class="w-24 h-24 rounded-full bg-black/40 border border-white/20 flex items-center justify-center mb-2 overflow-hidden cursor-pointer hover:border-amber-500 transition-colors"
                >
                  <User class="w-8 h-8 text-gray-500" />
                </div>
                <span class="text-sm text-amber-400"
                  >{$adkT("Upload Photo")}</span
                >
              </div>

              <div>
                <label
                  for="agent-fullname"
                  class="block text-sm text-gray-400 mb-1"
                  >{$adkT("Full Name *")}</label
                >
                <input
                  dir="auto"
                  id="agent-fullname"
                  type="text"
                  autocomplete="name"
                  bind:value={formData.fullName}
                  class="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder={$adkT("John Doe")}
                />
              </div>

              <div>
                <label for="agent-dob" class="block text-sm text-gray-400 mb-1"
                  >{$adkT("Date of Birth")}</label
                >
                <input
                  dir="auto"
                  id="agent-dob"
                  type="date"
                  bind:value={formData.dob}
                  class="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label
                  for="agent-gender"
                  class="block text-sm text-gray-400 mb-1"
                  >{$adkT("Gender")}</label
                >
                <select
                  id="agent-gender"
                  bind:value={formData.gender}
                  class="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                >
                  <option>{$adkT("Male")}</option><option
                    >{$adkT("Female")}</option
                  ><option>{$adkT("Prefer not to say")}</option>
                </select>
              </div>

              <div>
                <label
                  for="agent-nationality"
                  class="block text-sm text-gray-400 mb-1"
                  >{$adkT("Nationality")}</label
                >
                <select
                  id="agent-nationality"
                  bind:value={formData.nationality}
                  class="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                >
                  <option>{$adkT("Nigeria")}</option><option
                    >{$adkT("Other")}</option
                  >
                </select>
              </div>

              <div>
                <p class="text-sm text-stone-400">
                  {$adkT(
                    "Submit your 11-digit NIN in your account. The format check does not perform government identity verification.",
                  )}
                </p>
              </div>

              <div>
                <label
                  for="agent-state-origin"
                  class="block text-sm text-gray-400 mb-1"
                  >{$adkT("State of Origin")}</label
                >
                <select
                  id="agent-state-origin"
                  bind:value={formData.stateOfOrigin}
                  class="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">{$adkT("Select State")}</option>
                  {#each NIGERIAN_STATES as state}
                    <option value={state}>{$adkT(state)}</option>
                  {/each}
                </select>
              </div>
            </div>
          </div>
        {/if}

        {#if currentStep === 2}
          <div in:fade>
            <h2 class="text-2xl font-bold text-amber-400 mb-6">
              {$adkT("Professional Details")}
            </h2>
            <div class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    for="agent-agency-name"
                    class="block text-sm text-gray-400 mb-1"
                    >{$adkT("Agency/Company Name")}</label
                  >
                  <input
                    dir="auto"
                    id="agent-agency-name"
                    type="text"
                    autocomplete="organization"
                    bind:value={formData.agencyName}
                    class="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500"
                    placeholder={$adkT("e.g. Apex Properties")}
                  />
                </div>
                <div>
                  <label
                    for="agent-type"
                    class="block text-sm text-gray-400 mb-1"
                    >{$adkT("Agent Type")}</label
                  >
                  <select
                    id="agent-type"
                    bind:value={formData.type}
                    class="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500"
                  >
                    <option>{$adkT("Independent Agent")}</option><option
                      >{$adkT("Agency Staff")}</option
                    ><option>{$adkT("Developer's Agent")}</option>
                  </select>
                </div>
                <div>
                  <label
                    for="agent-rean"
                    class="block text-sm text-gray-400 mb-1 flex justify-between"
                  >
                    <span>{$adkT("REAN Membership Number")}</span>
                    <span
                      class="text-stone-500 text-xs"
                      title={$adkT(
                        "Real Estate Agents Network — membership optional",
                      )}>{$adkT("Optional")}</span
                    >
                  </label>
                  <input
                    dir="auto"
                    id="agent-rean"
                    type="text"
                    bind:value={formData.reanNumber}
                    class="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500"
                    placeholder={$adkT("Optional")}
                  />
                </div>
                <div>
                  <label
                    for="agent-experience"
                    class="block text-sm text-gray-400 mb-1"
                    >{$adkT("Years of Experience")}</label
                  >
                  <select
                    id="agent-experience"
                    bind:value={formData.experience}
                    class="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500"
                  >
                    <option>{$adkT("Less than 1")}</option><option>1-3</option
                    ><option>3-5</option><option>5-10</option><option
                      >10+</option
                    >
                  </select>
                </div>
              </div>

              <div>
                <span
                  id="specializations-label"
                  class="block text-sm text-gray-400 mb-2"
                  >{$adkT("Specializations")}</span
                >
                <div
                  class="grid grid-cols-2 sm:grid-cols-3 gap-3"
                  role="group"
                  aria-labelledby="specializations-label"
                >
                  {#each SPECIALIZATIONS as spec}
                    <label
                      class="flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors {formData.specializations.includes(
                        spec,
                      )
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                        : 'bg-black/20 border-white/10 hover:border-white/30 text-gray-300'}"
                    >
                      <input
                        dir="auto"
                        type="checkbox"
                        class="hidden"
                        checked={formData.specializations.includes(spec)}
                        on:change={() => toggleSpec(spec)}
                      />
                      <span class="text-sm">{$adkT(spec)}</span>
                    </label>
                  {/each}
                </div>
              </div>

              <div>
                <label
                  for="agent-bio"
                  class="block text-sm text-gray-400 mb-1 flex justify-between"
                >
                  <span>{$adkT("About You / Bio")}</span>
                  <span>{$adkT(formData.bio.length)}/500</span>
                </label>
                <textarea
                  dir="auto"
                  id="agent-bio"
                  bind:value={formData.bio}
                  maxlength="500"
                  rows="4"
                  class="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500"
                  placeholder={$adkT(
                    "Tell clients about your experience and approach...",
                  )}
                ></textarea>
              </div>
            </div>
          </div>
        {/if}

        {#if currentStep === 3}
          <div in:fade>
            <h2 class="text-2xl font-bold text-amber-400 mb-6">
              {$adkT("Contact & Coverage Areas")}
            </h2>
            <div class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    for="agent-phone"
                    class="block text-sm text-gray-400 mb-1"
                    >{$adkT("Phone Number *")}</label
                  >
                  <div class="flex">
                    <span
                      class="inline-flex items-center px-3 bg-black/60 border border-r-0 border-white/10 rounded-l-lg text-gray-400"
                      >+234</span
                    >
                    <input
                      dir="auto"
                      id="agent-phone"
                      type="tel"
                      inputmode="tel"
                      autocomplete="tel-national"
                      bind:value={formData.phone}
                      class="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-r-lg px-4 py-2 text-white focus:border-amber-500"
                      placeholder="801 234 5678"
                    />
                  </div>
                </div>
                <div>
                  <div class="mb-1 flex justify-between">
                    <label for="agent-whatsapp" class="text-sm text-gray-400"
                      >{$adkT("WhatsApp Number")}</label
                    >
                    <label
                      class="flex items-center gap-1 text-xs cursor-pointer"
                    >
                      <input
                        dir="auto"
                        type="checkbox"
                        bind:checked={formData.whatsappSame}
                        class="rounded border-gray-600 bg-black/40 text-amber-500 focus:ring-amber-500"
                      />
                      {$adkT("Same as phone")}
                    </label>
                  </div>
                  <div class="flex">
                    <span
                      class="inline-flex items-center px-3 bg-black/60 border border-r-0 border-white/10 rounded-l-lg text-gray-400"
                      >+234</span
                    >
                    <input
                      dir="auto"
                      id="agent-whatsapp"
                      type="tel"
                      inputmode="tel"
                      autocomplete="tel-national"
                      disabled={formData.whatsappSame}
                      bind:value={formData.whatsapp}
                      class="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-r-lg px-4 py-2 text-white focus:border-amber-500 disabled:opacity-50"
                      placeholder="801 234 5678"
                    />
                  </div>
                </div>
                <div>
                  <label
                    for="agent-email"
                    class="block text-sm text-gray-400 mb-1"
                    >{$adkT("Business Email *")}</label
                  >
                  <input
                    dir="auto"
                    id="agent-email"
                    type="email"
                    inputmode="email"
                    autocomplete="email"
                    bind:value={formData.email}
                    class="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500"
                    placeholder={$adkT("agent@example.com")}
                  />
                </div>
                <div>
                  <label
                    for="agent-expected-listings"
                    class="block text-sm text-gray-400 mb-1"
                    >{$adkT("Expected Monthly Listings")}</label
                  >
                  <select
                    id="agent-expected-listings"
                    bind:value={formData.expectedListings}
                    class="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500"
                  >
                    <option>1-5</option><option>5-10</option><option
                      >10-20</option
                    ><option>20+</option>
                  </select>
                </div>
                <div class="md:col-span-2">
                  <label
                    for="agent-address"
                    class="block text-sm text-gray-400 mb-1"
                    >{$adkT("Office Address")}</label
                  >
                  <textarea
                    dir="auto"
                    id="agent-address"
                    bind:value={formData.address}
                    rows="2"
                    class="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500"
                    placeholder={$adkT("123 Agent Street...")}
                  ></textarea>
                </div>
              </div>

              <div class="sm:col-span-2">
                <NigeriaLocationFields
                  bind:state={operationState}
                  bind:lga={operationLga}
                  required
                />
              </div>
            </div>
          </div>
        {/if}

        {#if currentStep === 4}
          <div in:fade>
            <h2 class="text-2xl font-bold text-amber-400 mb-6">
              {$adkT("Documents Upload")}
            </h2>
            <p class="text-gray-400 mb-6">
              {$adkT(
                "Please upload clear copies of the following documents. Files are verified during the review call.",
              )}
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              {#each [{ id: "photo", name: "Professional Photo", req: true, types: "JPG/PNG, max 2MB" }, { id: "id", name: "Government-Issued ID", req: true, types: "NIN/Passport/DL, max 5MB" }, { id: "license", name: "Agency Authorization", req: true, types: "PDF/JPG, max 5MB" }, { id: "cert", name: "REAN/NIA Certificate", req: false, types: "PDF/JPG, max 5MB" }] as doc}
                <div
                  class="border border-dashed border-white/20 rounded-xl p-6 bg-black/20 flex flex-col items-center justify-center text-center hover:border-amber-500/50 hover:bg-amber-500/5 transition-colors cursor-pointer group"
                >
                  <User
                    class="h-10 w-10 text-gray-500 mb-3 group-hover:text-amber-400 transition-colors"
                  />
                  <h3 class="font-medium text-white flex items-center gap-2">
                    {$adkT(doc.name)}
                    {#if doc.req}<span
                        class="text-[10px] uppercase bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded"
                        >{$adkT("Required")}</span
                      >{/if}
                  </h3>
                  <p class="text-xs text-gray-500 mt-1">{$adkT(doc.types)}</p>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        {#if currentStep === 5}
          <div in:fade>
            <h2 class="text-2xl font-bold text-amber-400 mb-6">
              {$adkT("Review & Submit")}
            </h2>

            <div class="space-y-4 mb-8">
              <div class="bg-black/30 rounded-xl p-5 border border-white/5">
                <h3
                  class="text-amber-400 font-medium mb-3 flex items-center gap-2"
                >
                  <User class="w-4 h-4" />
                  {$adkT("Personal Info")}
                </h3>
                <div class="grid grid-cols-2 gap-y-2 text-sm">
                  <span class="text-gray-500">{$adkT("Name:")}</span>
                  <span>{formData.fullName || "Not provided"}</span>
                  <span class="text-gray-500">{$adkT("Nationality:")}</span>
                  <span>{$adkT(formData.nationality)}</span>
                  <span class="text-gray-500">{$adkT("State of Origin:")}</span>
                  <span>{$adkT(formData.stateOfOrigin || "Not provided")}</span>
                </div>
              </div>

              <div class="bg-black/30 rounded-xl p-5 border border-white/5">
                <h3
                  class="text-amber-400 font-medium mb-3 flex items-center gap-2"
                >
                  <Briefcase class="w-4 h-4" />
                  {$adkT("Professional")}
                </h3>
                <div class="grid grid-cols-2 gap-y-2 text-sm">
                  <span class="text-gray-500">{$adkT("Agency:")}</span>
                  <span>{$adkT(formData.agencyName || "Not provided")}</span>
                  <span class="text-gray-500">{$adkT("Type:")}</span>
                  <span>{$adkT(formData.type)}</span>
                  <span class="text-gray-500">{$adkT("Experience:")}</span>
                  <span>{$adkT(formData.experience)} {$adkT("years")}</span>
                  <span class="text-gray-500">{$adkT("Specializations:")}</span>
                  <span
                    >{$adkT(formData.specializations.length)}
                    {$adkT("selected")}</span
                  >
                </div>
              </div>

              <div class="bg-black/30 rounded-xl p-5 border border-white/5">
                <h3
                  class="text-amber-400 font-medium mb-3 flex items-center gap-2"
                >
                  <MapPin class="w-4 h-4" />
                  {$adkT("Coverage")}
                </h3>
                <div class="grid grid-cols-2 gap-y-2 text-sm">
                  <span class="text-gray-500">{$adkT("Phone:")}</span>
                  <span>+234 {formData.phone || "Not provided"}</span>
                  <span class="text-gray-500">{$adkT("Email:")}</span>
                  <span>{formData.email || "Not provided"}</span>
                  <span class="text-gray-500">{$adkT("States:")}</span>
                  <span>{$adkT(operationState || "None")}</span>
                </div>
              </div>
            </div>

            <label
              class="flex items-start gap-3 cursor-pointer p-4 bg-black/40 border border-white/10 rounded-lg"
            >
              <input
                dir="auto"
                type="checkbox"
                bind:checked={formData.termsAccepted}
                class="mt-1 w-5 h-5 rounded border-gray-600 text-amber-500 focus:ring-amber-500 bg-black"
              />
              <span class="text-sm text-gray-300">
                {$adkT(
                  "I confirm that all information provided is accurate and authentic. I agree to the Terms of Service and acknowledge that ADK reserves the right to suspend accounts with fraudulent information.",
                )}
              </span>
            </label>
          </div>
        {/if}

        {#if submitError}
          <p
            class="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300"
          >
            {$adkT(submitError)}
          </p>
        {/if}

        <!-- Navigation Buttons -->
        <div
          class="flex justify-between items-center mt-10 pt-6 border-t border-white/10"
        >
          <button
            class="flex items-center gap-2 min-h-[44px] px-6 py-2.5 rounded-lg border border-white/20 text-gray-300 hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            on:click={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft class="w-4 h-4" />
            {$adkT("Back")}
          </button>

          {#if currentStep < totalSteps}
            <button
              class="flex items-center gap-2 min-h-[44px] px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-medium transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)]"
              on:click={nextStep}
            >
              {$adkT("Continue")}
              <ArrowRight class="w-4 h-4" />
            </button>
          {:else}
            <button
              class="flex items-center gap-2 min-h-[44px] px-8 py-3 rounded-lg bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-white font-medium transition-transform hover:scale-105 shadow-[0_0_20px_rgba(245,158,11,0.4)] disabled:opacity-50"
              disabled={!formData.termsAccepted || submitting || !ready}
              on:click={submitForm}
            >
              {#if submitting}
                <Loader2 class="w-4 h-4 animate-spin" />
                {$adkT("Submitting…")}{:else}{$adkT("Submit Application")}
                <ArrowRight class="w-4 h-4" />
              {/if}
            </button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
