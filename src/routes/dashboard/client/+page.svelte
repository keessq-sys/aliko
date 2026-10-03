<script lang="ts">
  import { getI18n } from "$lib/i18n";
  const { locale: adkLocale } = getI18n();

  import DashboardSidebar from "$lib/components/layout/DashboardSidebar.svelte";
  import { page } from "$app/stores";
  import IdentityStatus from "$lib/components/auth/IdentityStatus.svelte";
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();
  import CheckoutButton from "$lib/components/payments/CheckoutButton.svelte";

  import {
    Heart,
    Calendar,
    FileText,
    MessageSquare,
    User,
    MapPin,
    Bed,
    Bath,
    Download,
    CalendarPlus,
    X,
    Inbox,
    ArrowRight,
    Landmark,
    Loader2,
    CreditCard,
    LogOut,
  } from "lucide-svelte";
  import { useQuery, runAction, runMutation } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { formatNaira } from "$lib/utils/format";
  import { REQUEST_STATUS_META } from "$lib/types/services";
  import { fly } from "svelte/transition";
  import ServiceConversation from "$lib/components/services/ServiceConversation.svelte";
  import { addToast } from "$lib/stores/ui";

  let currentTab = "bookings";

  const myBookings = useQuery(api.bookings.getMyBookings, {});
  const savedProperties = useQuery(api.clientPortal.listSavedProperties, {});
  const mySiteVisits = useQuery(api.clientPortal.getMySiteVisits, {});
  const myDocuments = useQuery(api.legalDocuments.getMyDocuments, {});

  const BOOKING_STATUS_META: Record<string, string> = {
    PENDING: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    PARTIAL: "text-blue-300 bg-blue-500/10 border-blue-500/30",
    SUCCESS: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    FAILED: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    REFUNDED: "text-stone-400 bg-stone-500/10 border-stone-500/30",
  };

  // ── Profile ───────────────────────────────────────────────────────────
  const myProfile = useQuery(api.users.getMyProfile, {});
  const myKyc = useQuery(api.kyc.getMyVerifications, {});

  let profileName = "";
  let profilePhone = "";
  let profileAddress = "";
  let photoInput: HTMLInputElement;
  let photoUploading = false;
  async function uploadPhoto(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    photoUploading = true;
    profileError = "";
    try {
      const args = {
        purpose: "AVATAR_IMAGE" as const,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
      };
      const url = await runMutation(api.storage.generateUploadUrl, args);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error("Photo upload failed");
      const { storageId } = await response.json();
      await runMutation(api.storage.registerUpload, { ...args, storageId });
      addToast({
        type: "info",
        message: "Photo uploaded. It will appear after the security scan.",
      });
    } catch (error) {
      profileError =
        error instanceof Error ? error.message : "Could not upload photo";
    } finally {
      photoUploading = false;
    }
  }
  let profileNameLoaded = false;

  // Only seed the editable fields from the loaded profile once, so typing
  // isn't clobbered by the query's own live updates while editing.
  $: if ($myProfile && !profileNameLoaded) {
    profileName = $myProfile.name ?? "";
    profilePhone = $myProfile.phone ?? "";
    profileAddress = $myProfile.address ?? "";
    profileNameLoaded = true;
  }

  let savingProfile = false;
  let profileSaved = false;
  let profileError = "";
  let kycStarting = false;
  let kycMessage = "";

  async function startKyc() {
    if (!$myProfile) return;
    kycStarting = true;
    kycMessage = "";
    try {
      await runMutation(api.kyc.acceptKycConsent, { version: "2026-10-03" });
      const session = await runAction(api.kyc.startQoreIdWorkflow, {
        type: "NIN",
      });
      const { default: QoreID } = await import("@qore-id/web-sdk");
      const names = ($myProfile.name || "ADK Customer").trim().split(/\s+/);
      await QoreID.init();
      QoreID.once("success", () => {
        kycMessage =
          "Verification submitted. Your status will update after QoreID confirms the result.";
      });
      QoreID.once("error", () => {
        kycMessage =
          "Verification could not be completed. Please try again or contact support.";
      });
      await QoreID.start({
        token: session.sdkSessionToken,
        customerReference: session.reference,
        applicantData: {
          firstname: names[0],
          lastname: names.slice(1).join(" ") || names[0],
          email: $myProfile.email,
          phone: $myProfile.phone || undefined,
        },
      });
    } catch (error) {
      kycMessage =
        error instanceof Error
          ? error.message
          : "Identity verification is unavailable.";
    } finally {
      kycStarting = false;
    }
  }

  async function saveProfile(e: Event) {
    e.preventDefault();
    savingProfile = true;
    profileSaved = false;
    profileError = "";
    try {
      await runMutation(api.users.updateMyProfile, {
        name: profileName.trim(),
        phone: profilePhone.trim(),
        address: profileAddress.trim(),
      } as any);
      profileSaved = true;
    } catch (err) {
      profileError =
        (err as Error).message ?? "Could not save changes. Please try again.";
    } finally {
      savingProfile = false;
    }
  }

  async function removeSaved(propertyId: string) {
    await runMutation(api.clientPortal.toggleSavedProperty, {
      propertyId,
    } as any);
  }

  async function cancelVisit(visitId: string) {
    await runMutation(api.clientPortal.cancelMySiteVisit, { visitId } as any);
  }

  const tabs = [
    { id: "bookings", label: "My Bookings", icon: Landmark },
    { id: "requests", label: "My Requests", icon: Inbox },
    { id: "saved", label: "Saved", icon: Heart },
    { id: "viewings", label: "Viewings", icon: Calendar },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "profile", label: "Profile", icon: User },
  ];

  // Live service requests submitted by this client.
  const myRequests = useQuery(api.serviceRequests.getMyRequests, {});
  $: requests = $myRequests;
  $: if (
    $page.url.hash &&
    tabs.some((tab) => tab.id === $page.url.hash.slice(1))
  )
    currentTab = $page.url.hash.slice(1);
</script>

<div
  class="flex flex-col md:flex-row min-h-[calc(100dvh-58px)] bg-[#050A0E] text-stone-300 font-sans"
  dir="ltr"
>
  <DashboardSidebar
    items={tabs}
    bind:active={currentTab}
    title="Client Portal"
  />
  <div class="min-w-0 flex-1" dir={$adkLocale === "ar" ? "rtl" : "ltr"}>
    <!-- Top Navigation -->
    <header
      class="border-b border-white/5 bg-[#050A0E]/80 backdrop-blur-md sticky top-0 z-20"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-2">
            <div
              class="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center"
            >
              <span class="text-white font-bold">{$adkT("C")}</span>
            </div>
            <h1 class="text-xl font-bold text-white">
              {$adkT("Client Portal")}
            </h1>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {#key currentTab}
        <div in:fly={{ y: 10, duration: 220, delay: 80 }}>
          {#if currentTab === "bookings"}
            <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 class="text-xl font-semibold text-white">
                {$adkT("My Bookings")}
              </h2>
              <a
                href="/plots"
                class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
              >
                {$adkT("Browse Plots")}
                <ArrowRight class="h-4 w-4" />
              </a>
            </div>

            {#if $myBookings === undefined}
              <div class="grid grid-cols-1 gap-4">
                {#each Array(2) as _}
                  <div class="skeleton h-24 rounded-xl"></div>
                {/each}
              </div>
            {:else if $myBookings.length === 0}
              <div
                class="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] py-16 text-center"
              >
                <Landmark class="mb-3 h-12 w-12 text-stone-700" />
                <p class="mb-1 font-medium text-white">
                  {$adkT("No plot bookings yet")}
                </p>
                <p class="mb-6 max-w-sm text-sm text-stone-400">
                  {$adkT(
                    "Reserve a verified land plot and track your payment status here.",
                  )}
                </p>
                <a href="/plots" class="btn-primary px-6 py-2.5 text-sm"
                  >{$adkT("Browse Plots")}</a
                >
              </div>
            {:else}
              <div class="space-y-4">
                {#each $myBookings as b (b._id)}
                  <div
                    class="rounded-xl border border-white/5 bg-white/[0.02] p-5"
                  >
                    <div
                      class="flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <div class="flex items-center gap-3">
                          <h3 class="font-semibold text-white">
                            {$adkT(b.plot?.beaconNumber ?? "Plot")}
                          </h3>
                          <span
                            class="rounded-full border px-2.5 py-0.5 text-[11px] font-bold {BOOKING_STATUS_META[
                              b.paymentStatus
                            ] ?? ''}"
                          >
                            {$adkT(b.paymentStatus)}
                          </span>
                        </div>
                        <p class="mt-0.5 font-mono text-xs text-stone-600">
                          {$adkT(b.reference)} · {$adkT(b.project?.name ?? "")}
                        </p>
                      </div>
                      <div class="text-right">
                        <p
                          class="text-[10px] uppercase tracking-wider text-stone-600"
                        >
                          {$adkT("Paid / Total")}
                        </p>
                        <p class="font-bold text-amber-400">
                          {$adkT(formatNaira(b.paidAmount, $adkLocale))}
                          <span class="text-xs text-stone-500"
                            >/ {$adkT(
                              formatNaira(b.totalAmount, $adkLocale),
                            )}</span
                          >
                        </p>
                      </div>
                    </div>
                    {#if b.paymentStatus === "PENDING"}
                      <a
                        href={`/checkout/${encodeURIComponent(b.reference)}`}
                        class="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        <CreditCard size={13} />
                        {$adkT("Pay with Flutterwave")}
                      </a>
                    {:else if b.paymentStatus === "PARTIAL"}
                      <a
                        href={`/plots/payment-callback?reference=${b.reference}`}
                        class="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:underline"
                      >
                        {$adkT("View payment status")}
                        <ArrowRight class="h-3 w-3" />
                      </a>
                      <p class="mt-1 text-[11px] text-stone-600">
                        {$adkT(
                          "Remaining-balance payment is arranged with your agent for installment plans.",
                        )}
                      </p>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          {:else if currentTab === "requests"}
            <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 class="text-xl font-semibold text-white">
                {$adkT("My Service Requests")}
              </h2>
              <a
                href="/services"
                class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
              >
                {$adkT("New Request")}
                <ArrowRight class="h-4 w-4" />
              </a>
            </div>

            {#if requests === undefined}
              <div class="grid grid-cols-1 gap-4">
                {#each Array(2) as _}
                  <div class="skeleton h-24 rounded-xl"></div>
                {/each}
              </div>
            {:else if requests.length === 0}
              <div
                class="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] py-16 text-center"
              >
                <Inbox class="mb-3 h-12 w-12 text-stone-700" />
                <p class="mb-1 font-medium text-white">
                  {$adkT("No requests yet")}
                </p>
                <p class="mb-6 max-w-sm text-sm text-stone-400">
                  {$adkT(
                    "Submit a request for interior design, Turkish tiles, smart homes, construction or any of our eight services.",
                  )}
                </p>
                <a href="/services" class="btn-primary px-6 py-2.5 text-sm"
                  >{$adkT("Browse Services")}</a
                >
              </div>
            {:else}
              <div class="space-y-4">
                {#each requests as req (req._id)}
                  <div
                    class="rounded-xl border border-white/5 bg-white/[0.02] p-5"
                  >
                    <div
                      class="flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <div class="flex items-center gap-3">
                          <h3 class="font-semibold text-white">
                            {$adkT(req.requestType.replace(/_/g, " "))}
                          </h3>
                          <span
                            class="rounded-full px-2.5 py-0.5 text-[11px] font-bold {REQUEST_STATUS_META[
                              req.status
                            ]?.classes ?? ''}"
                          >
                            {$adkT(
                              REQUEST_STATUS_META[req.status]?.label ??
                                req.status,
                            )}
                          </span>
                        </div>
                        <p class="mt-0.5 font-mono text-xs text-stone-600">
                          {$adkT(req.reference)} · {$adkT(req.serviceSlug)}
                        </p>
                      </div>
                      {#if req.quoteAmount && !req.paidAmount && ["QUOTED", "ACCEPTED", "IN_PROGRESS"].includes(req.status)}<CheckoutButton
                          kind="SERVICE"
                          targetId={req._id}
                          label="Review service payment"
                        />{/if}
                      {#if req.quoteAmount}
                        <div class="text-right">
                          <p
                            class="text-[10px] uppercase tracking-wider text-stone-600"
                          >
                            {$adkT("Quote")}
                          </p>
                          <p class="font-bold text-amber-400">
                            {$adkT(formatNaira(req.quoteAmount, $adkLocale))}
                          </p>
                        </div>
                      {/if}
                    </div>
                    {#if req.adminResponse}
                      <div
                        class="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"
                      >
                        <p
                          class="text-[10px] font-bold uppercase tracking-wider text-emerald-500"
                        >
                          {$adkT("ADK Response")}
                        </p>
                        <p class="mt-1 text-sm text-emerald-100">
                          {$adkT(req.adminResponse)}
                        </p>
                      </div>
                    {:else}
                      <IdentityStatus />
                      <p class="mt-3 text-xs text-stone-500">
                        {$adkT(
                          "Our admin desk responds within 48 hours of submission.",
                        )}
                      </p>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          {:else if currentTab === "saved"}
            <div class="mb-6 flex justify-between items-center">
              <h2 class="text-xl font-semibold text-white">
                {$adkT("Your Wishlist (")}{$adkT($savedProperties?.length ?? 0)}
                {$adkT("properties)")}
              </h2>
            </div>
            {#if $savedProperties === undefined}<div
                class="skeleton h-48 rounded-xl"
              ></div>
            {:else if $savedProperties.length === 0}
              <div class="rounded-2xl border border-white/5 py-16 text-center">
                <Heart class="mx-auto mb-3 h-10 w-10 text-stone-700" />
                <p class="text-white">{$adkT("No saved properties")}</p>
                <a href="/properties" class="mt-4 inline-block text-emerald-400"
                  >{$adkT("Browse verified listings")}</a
                >
              </div>
            {:else}
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each $savedProperties as saved (saved._id)}
                  {@const prop = saved.property}
                  <div
                    class="rounded-xl border border-white/5 bg-[#050A0E]/80 overflow-hidden shadow-xl group"
                  >
                    <div class="relative h-48 w-full overflow-hidden">
                      <img
                        src={prop.images?.[0] ?? "/logo.png"}
                        alt={$adkT(prop.title)}
                        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <button
                        on:click={() => removeSaved(prop._id)}
                        class="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-black/50 text-emerald-400 hover:bg-rose-500/80 hover:text-white transition-colors backdrop-blur-md"
                        aria-label={$adkT("Remove from saved properties")}
                      >
                        <Heart class="w-4 h-4 fill-current" />
                      </button>
                      <div
                        class="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs text-white"
                      >
                        {$adkT("Saved")}
                        {$adkT(
                          new Date(saved.createdAt).toLocaleDateString(
                            $adkLocale === "ar" ? "ar-NG" : "en-NG",
                          ),
                        )}
                      </div>
                    </div>
                    <div class="p-5">
                      <h3 class="text-lg font-semibold text-white truncate">
                        {$adkT(prop.title)}
                      </h3>
                      <p class="text-emerald-400 font-bold mt-1">
                        ₦{$adkT((prop.price / 1000000).toFixed(1))}{$adkT("M")}
                      </p>

                      <div
                        class="flex items-center gap-4 mt-3 text-sm text-stone-400"
                      >
                        <span class="flex items-center gap-1"
                          ><Bed class="w-4 h-4" />
                          {$adkT(prop.bedrooms ?? "—")}
                          {$adkT("Beds")}</span
                        >
                        <span class="flex items-center gap-1"
                          ><Bath class="w-4 h-4" />
                          {$adkT(prop.bathrooms ?? "—")}
                          {$adkT("Baths")}</span
                        >
                      </div>
                      <p
                        class="flex items-center gap-1 mt-2 text-sm text-stone-500 truncate"
                      >
                        <MapPin class="w-4 h-4" />
                        {$adkT(prop.location)}
                      </p>

                      <a
                        href={`/properties/${prop.slug}`}
                        class="block w-full mt-4 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 py-2 rounded-lg font-medium text-center transition-colors"
                        >{$adkT("View property")}</a
                      >
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          {:else if currentTab === "viewings"}
            <div class="mb-6 flex justify-between items-center">
              <h2 class="text-xl font-semibold text-white">
                {$adkT("Upcoming Viewings")}
              </h2>
              <button
                class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
              >
                <CalendarPlus class="w-4 h-4" />
                {$adkT("Schedule New")}
              </button>
            </div>

            {#if $mySiteVisits === undefined}<div
                class="skeleton h-32 rounded-xl"
              ></div>
            {:else if $mySiteVisits.length === 0}<div
                class="rounded-2xl border border-white/5 py-16 text-center text-stone-400"
              >
                {$adkT("No site visits have been scheduled.")}
              </div>
            {:else}<div class="space-y-4">
                {#each $mySiteVisits as view (view._id)}
                  <div
                    class="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02]"
                  >
                    <img
                      src={view.property?.images?.[0] ?? "/logo.png"}
                      alt={$adkT("Property")}
                      class="w-24 h-24 rounded-lg object-cover"
                    />
                    <div class="flex-1">
                      <div class="flex justify-between items-start">
                        <div>
                          <h3 class="text-lg font-medium text-white">
                            {$adkT(
                              view.property?.title ??
                                view.project?.name ??
                                "Site visit",
                            )}
                          </h3>
                          <p class="text-emerald-400 font-medium mt-1">
                            {$adkT(
                              new Date(view.requestedAt).toLocaleDateString(
                                $adkLocale === "ar" ? "ar-NG" : "en-NG",
                              ),
                            )}
                            {$adkT("at")}
                            {$adkT(view.preferredTime)}
                          </p>
                        </div>
                        <span
                          class="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        >
                          {$adkT(view.status.replace(/_/g, " "))}
                        </span>
                      </div>
                      <div class="mt-4 flex flex-wrap gap-4 text-sm">
                        <span class="flex items-center gap-1 text-stone-400"
                          ><User class="w-4 h-4" />
                          {$adkT("Agent:")}
                          {$adkT(view.agent?.name ?? "To be assigned")}</span
                        >
                        <span class="flex items-center gap-1 text-stone-400"
                          ><MapPin class="w-4 h-4" />
                          {$adkT(
                            view.property?.location ??
                              view.project?.location ??
                              "Location pending",
                          )}</span
                        >
                      </div>
                    </div>
                    <div
                      class="flex sm:flex-col gap-2 justify-end sm:border-l border-white/5 sm:pl-4"
                    >
                      {#if view.status !== "COMPLETED" && view.status !== "CANCELLED"}<button
                          on:click={() => cancelVisit(view._id)}
                          class="flex-1 sm:flex-none px-4 py-2 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-lg text-sm"
                          >{$adkT("Cancel")}</button
                        >{/if}
                    </div>
                  </div>
                {/each}
              </div>{/if}
          {:else if currentTab === "documents"}
            <h2 class="text-xl font-semibold text-white mb-6">
              {$adkT("My Documents")}
            </h2>
            {#if $myDocuments === undefined}<div
                class="skeleton h-32 rounded-xl"
              ></div>
            {:else if $myDocuments.length === 0}<div
                class="rounded-2xl border border-white/5 py-16 text-center text-stone-400"
              >
                {$adkT("No legal documents are available yet.")}
              </div>
            {:else}<div
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {#each $myDocuments as doc (doc._id)}
                  <div
                    class="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-start gap-4"
                  >
                    <div class="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
                      <FileText class="w-6 h-6" />
                    </div>
                    <div class="flex-1">
                      <h4 class="text-sm font-medium text-white mb-1">
                        {$adkT(doc.type.replace(/_/g, " "))}
                      </h4>
                      <p class="text-xs text-stone-400">
                        {$adkT(doc.referenceCode)}
                      </p>
                      <div
                        class="mt-2 flex justify-between items-center text-xs text-stone-500"
                      >
                        <span
                          >{$adkT(
                            new Date(doc.createdAt).toLocaleDateString(
                              $adkLocale === "ar" ? "ar-NG" : "en-NG",
                            ),
                          )}</span
                        >
                        <span>{$adkT(doc.status)}</span>
                      </div>
                    </div>
                    <a
                      href={doc.pdfUrl ??
                        `/legal/track?reference=${encodeURIComponent(doc.referenceCode)}`}
                      class="min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-white/10 rounded-full text-stone-400 hover:text-white"
                      aria-label={$adkT("Open document")}
                    >
                      <Download class="w-4 h-4" />
                    </a>
                  </div>
                {/each}
              </div>
            {/if}
          {:else if currentTab === "profile"}
            <div class="max-w-2xl mx-auto">
              <div
                class="rounded-xl border border-white/5 bg-white/[0.02] p-6 sm:p-8"
              >
                <h2
                  class="text-xl font-semibold text-white mb-6 border-b border-white/10 pb-4"
                >
                  {$adkT("Personal Information")}
                </h2>
                <form class="space-y-6" on:submit={saveProfile}>
                  <div class="flex items-center gap-4 mb-8">
                    <img
                      src={$myProfile?.avatarUrl ?? "/logo.png"}
                      alt={$adkT("Profile")}
                      class="w-20 h-20 rounded-full border-2 border-emerald-500/50"
                    />
                    <button
                      type="button"
                      disabled={photoUploading}
                      on:click={() => photoInput.click()}
                      title={$adkT(
                        "Upload a profile image for security scanning",
                      )}
                      class="px-4 py-2 bg-white/5 rounded-lg text-sm text-stone-500 cursor-not-allowed"
                      >{$adkT(
                        photoUploading ? "Uploading…" : "Change Photo",
                      )}</button
                    >
                    <input
                      dir="auto"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      bind:this={photoInput}
                      on:change={uploadPhoto}
                      class="hidden"
                      aria-label={$adkT("Choose profile photo")}
                    />
                  </div>

                  {#if $myProfile === undefined}
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {#each Array(3) as _}<div
                          class="skeleton h-11 rounded-lg"
                        ></div>{/each}
                    </div>
                  {:else}
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div class="space-y-2">
                        <label for="client-name" class="text-sm text-stone-400"
                          >{$adkT("Full Name")}</label
                        >
                        <input
                          dir="auto"
                          id="client-name"
                          type="text"
                          bind:value={profileName}
                          class="w-full min-h-[44px] bg-[#050A0E] border border-white/10 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div class="space-y-2">
                        <label for="client-email" class="text-sm text-stone-400"
                          >{$adkT("Email")}</label
                        >
                        <input
                          dir="auto"
                          id="client-email"
                          type="email"
                          value={$myProfile?.email ?? ""}
                          disabled
                          title={$adkT(
                            "Contact support to change your sign-in email",
                          )}
                          class="w-full min-h-[44px] bg-[#050A0E] border border-white/10 rounded-lg p-2.5 text-stone-500 outline-none cursor-not-allowed"
                        />
                      </div>
                      <div class="space-y-2">
                        <label for="client-phone" class="text-sm text-stone-400"
                          >{$adkT("Phone")}</label
                        >
                        <input
                          dir="auto"
                          id="client-phone"
                          type="tel"
                          inputmode="tel"
                          bind:value={profilePhone}
                          class="w-full min-h-[44px] bg-[#050A0E] border border-white/10 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                        />
                        <label
                          for="client-address"
                          class="text-sm text-stone-400"
                          >{$adkT("Legal address")}</label
                        ><textarea
                          dir="auto"
                          id="client-address"
                          bind:value={profileAddress}
                          maxlength="500"
                          class="theme-input w-full rounded-lg border p-3"
                          placeholder={$adkT(
                            "Complete address for your legal documents",
                          )}
                        ></textarea>
                      </div>
                    </div>
                  {/if}

                  {#if profileError}
                    <p
                      class="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300"
                    >
                      {$adkT(profileError)}
                    </p>
                  {/if}
                  {#if profileSaved}
                    <p
                      class="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300"
                    >
                      {$adkT("Profile updated.")}
                    </p>
                  {/if}

                  <div class="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      class="flex min-h-[44px] items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-60"
                    >
                      {#if savingProfile}<Loader2
                          class="h-4 w-4 animate-spin"
                        />{/if}
                      {$adkT("Save Changes")}
                    </button>
                  </div>
                </form>
              </div>

              <div
                class="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-6 sm:p-8"
              >
                <div class="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 class="text-lg font-semibold text-white">
                      {$adkT("Identity verification")}
                    </h2>
                    <p class="mt-1 text-sm text-stone-400">
                      {$adkT(
                        "QoreID verifies your identity in its secure flow. ADK stores the result and reference. Your registration NIN is encrypted and accessible only to the super administrator for verification.",
                      )}
                    </p>
                    {#if $myKyc?.[0]}
                      <p
                        class="mt-3 text-sm font-semibold {$myKyc[0].status ===
                        'VERIFIED'
                          ? 'text-emerald-400'
                          : $myKyc[0].status === 'FAILED'
                            ? 'text-rose-400'
                            : 'text-amber-400'}"
                      >
                        {$adkT("Status:")}
                        {$adkT($myKyc[0].status)}
                      </p>
                    {/if}
                  </div>
                  <button
                    type="button"
                    on:click={startKyc}
                    disabled={kycStarting || $myKyc?.[0]?.status === "VERIFIED"}
                    class="flex min-h-[44px] items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {#if kycStarting}<Loader2
                        class="h-4 w-4 animate-spin"
                      />{/if}
                    {$adkT(
                      $myKyc?.[0]?.status === "VERIFIED"
                        ? "Identity verified"
                        : "Start verification",
                    )}
                  </button>
                </div>
                <p class="mt-3 text-xs text-stone-500">
                  {$adkT("By continuing, you accept the")}
                  <a
                    href="/legal/kyc-consent"
                    class="text-emerald-400 hover:underline"
                    >{$adkT("KYC consent notice")}</a
                  >.
                </p>
                {#if kycMessage}<p
                    class="mt-3 rounded-lg border border-white/10 px-4 py-3 text-sm text-stone-300"
                  >
                    {$adkT(kycMessage)}
                  </p>{/if}
              </div>

              <div class="mt-6 flex justify-center">
                <a
                  href="/login?signout=1"
                  class="flex items-center gap-2 min-h-[44px] px-4 text-sm font-medium text-rose-400 hover:text-rose-300"
                >
                  <LogOut class="h-4 w-4" />
                  {$adkT("Sign Out")}
                </a>
              </div>
            </div>
          {:else if currentTab === "messages"}
            <div class="mx-auto max-w-3xl">
              <h2 class="mb-2 text-xl font-semibold text-white">
                {$adkT("Messages with Support")}
              </h2>
              <p class="mb-6 text-sm text-stone-400">
                {$adkT(
                  "Each conversation stays linked to its service request and updates in real time.",
                )}
              </p>
              {#if $myRequests === undefined}<div
                  class="skeleton h-40 rounded-2xl"
                ></div>
              {:else if $myRequests.length === 0}<div
                  class="rounded-2xl border border-white/10 py-16 text-center text-stone-500"
                >
                  <MessageSquare class="mx-auto mb-3 h-10 w-10 opacity-30" />
                  <p>
                    {$adkT("Submit a service request to start a conversation.")}
                  </p>
                </div>
              {:else}<div class="space-y-5">
                  {#each $myRequests as request (request._id)}<ServiceConversation
                      {request}
                    />{/each}
                </div>{/if}
            </div>
          {:else}
            <div class="py-20 text-center text-stone-500">
              {$adkT("This area is being prepared.")}
            </div>
          {/if}
        </div>
      {/key}
    </main>
  </div>
</div>

<style>
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
