<script lang="ts">
  import ProfilePhotoEditor from "$lib/components/dashboard/ProfilePhotoEditor.svelte";
  import { tick } from "svelte";
  import { getI18n } from "$lib/i18n";
  const { locale: adkLocale } = getI18n();

  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();

  import { useQuery, runMutation } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import {
    Briefcase,
    CheckCircle,
    XCircle,
    Loader2,
    Search,
  } from "lucide-svelte";
  import { formatRelative } from "$lib/utils/format";
  import { REQUEST_STATUS_META } from "$lib/types/services";

  const applications = useQuery(api.partners.listAgentApplications, {});
  const review = async (args: any) =>
    runMutation(api.partners.reviewAgentApplication, args);

  let selectedId: any = null;
  let detailError = "";
  async function openApplication(app: any) {
    detailError = "";
    selectedId = app._id;
    manualReference = app.manualVerificationReference ?? "";
    reviewNotes = app.reviewNotes ?? "";
    await tick();
    document
      .getElementById("verification-details")
      ?.scrollIntoView({ block: "start" });
  }
  $: detail = useQuery(
    selectedId ? api.partners.agentApplicationDetail : null,
    { id: selectedId },
    (cause) => (detailError = cause.message),
  );
  let manualReference = "",
    reviewNotes = "";
  let actingId: string | null = null;
  let error = "";
  let search = "";

  $: filtered = ($applications ?? []).filter((a: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.fullName.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.agencyName ?? "").toLowerCase().includes(q)
    );
  });
  $: pendingCount = ($applications ?? []).filter(
    (a: any) => a.status === "PENDING" || a.status === "UNDER_REVIEW",
  ).length;
  $: approvedCount = ($applications ?? []).filter(
    (a: any) => a.status === "APPROVED",
  ).length;

  async function act(
    id: any,
    status: "APPROVED" | "REJECTED" | "UNDER_REVIEW",
  ) {
    actingId = String(id);
    error = "";
    try {
      await review({
        id,
        status,
        reviewNotes,
        manualVerificationReference: manualReference,
      });
    } catch (err: any) {
      error = err?.message ?? "Action failed.";
    } finally {
      actingId = null;
    }
  }
</script>

<svelte:head><title>{$adkT("Agent Approvals — ADK Admin")}</title></svelte:head>

<div class="p-8">
  <div
    class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
  >
    <div>
      <h1 class="flex items-center gap-2 text-xl font-bold text-white">
        <Briefcase class="h-5 w-5 text-amber-400" />
        {$adkT("Agent Applications")}
      </h1>
      <p class="mt-0.5 text-sm text-stone-500">
        {$adkT(
          "Review and approve agents from the 5-step registration wizard.",
        )}
      </p>
    </div>
    <div class="relative">
      <Search
        class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-500"
      />
      <input
        dir="auto"
        type="text"
        bind:value={search}
        placeholder={$adkT("Search name, email, agency…")}
        class="w-64 rounded-xl border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-xs text-white placeholder-stone-600 outline-none focus:border-emerald-500"
      />
    </div>
  </div>

  {#if $applications}
    <div class="mb-6 grid grid-cols-3 gap-3">
      <div
        class="rounded-xl px-4 py-3"
        style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06)"
      >
        <p class="text-xl font-black text-white">
          {$adkT($applications.length)}
        </p>
        <p class="text-xs text-stone-500">{$adkT("Total Applications")}</p>
      </div>
      <div
        class="rounded-xl px-4 py-3"
        style="background: rgba(217,119,6,0.08); border: 1px solid rgba(217,119,6,0.2)"
      >
        <p class="text-xl font-black text-amber-400">{$adkT(pendingCount)}</p>
        <p class="text-xs text-stone-500">{$adkT("Pending Review")}</p>
      </div>
      <div
        class="rounded-xl px-4 py-3"
        style="background: rgba(5,150,105,0.08); border: 1px solid rgba(5,150,105,0.2)"
      >
        <p class="text-xl font-black text-emerald-400">
          {$adkT(approvedCount)}
        </p>
        <p class="text-xs text-stone-500">{$adkT("Approved")}</p>
      </div>
    </div>
  {/if}

  {#if error}
    <p
      class="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300"
    >
      {$adkT(error)}
    </p>
  {/if}

  {#if selectedId}
    <section
      id="verification-details"
      class="theme-surface theme-text rounded-2xl border p-5 mb-6 space-y-4"
    >
      <div class="flex justify-between gap-3">
        <h2 class="text-xl font-semibold">
          {$adkT("Application verification details")}
        </h2>
        <button
          type="button"
          class="border rounded-lg px-4 min-h-[44px]"
          on:click={() => (selectedId = null)}>{$adkT("Close")}</button
        >
      </div>
      {#if $detail}
        {#if $detail.userId}<ProfilePhotoEditor avatarTargetId={$detail.userId} avatarUrl={$detail.avatarUrl ?? undefined} />{/if}
        {#if $detail.avatarUrl}<img
            src={$detail.avatarUrl}
            alt="Applicant portrait"
            class="w-24 h-24 rounded-full object-cover"
          />{/if}
        <dl class="grid gap-4 sm:grid-cols-2">
          {#each [["Name", $detail.fullName], ["Email", $detail.email], ["Phone", $detail.phone], ["WhatsApp", $detail.whatsapp], ["Address", $detail.address], ["State", $detail.operatingState], ["LGA", $detail.operatingLga], ["Date of birth", $detail.birthDate], ["Gender", $detail.gender], ["Nationality", $detail.nationality], ["State of origin", $detail.stateOfOrigin], ["Agency", $detail.agencyName], ["Agent type", $detail.agentType], ["Experience", $detail.experience], ["Specializations", $detail.specializations?.join(", ")], ["States of operation", $detail.statesOfOperation?.join(", ")], ["Primary LGAs", $detail.primaryLgas], ["Expected listings", $detail.expectedListings], ["Biography", $detail.bio], ["Submitted NIN (unverified)", $detail.maskedNin], ["Registration payment", $detail.registrationPayment], ["Manual verification", $detail.manualVerificationReference], ["Review notes", $detail.reviewNotes]] as field}<div
            >
              <dt class="text-sm theme-field-muted">{$adkT(field[0])}</dt>
              <dd class="break-words">{field[1] ?? "—"}</dd>
            </div>{/each}
        </dl>
        <p class="rounded-lg border p-3">
          {$adkT(
            "An eleven-digit number is not identity verification. Confirm the applicant physically and record your evidence reference. BVN and automated identity checks are suspended.",
          )}
        </p>
        <label class="block"
          >{$adkT("Physical identity and address confirmation reference")}<input
            bind:value={manualReference}
            class="theme-input block w-full border rounded-lg p-3 min-h-[44px]"
          /></label
        >
        <label class="block"
          >{$adkT("Review notes")}<textarea
            bind:value={reviewNotes}
            class="theme-input block w-full border rounded-lg p-3"
          ></textarea></label
        >
        <div class="flex flex-wrap gap-3">
          {#each ["UNDER_REVIEW", "APPROVED", "REJECTED"] as state}<button
              type="button"
              disabled={!!actingId}
              class="min-h-[44px] rounded-lg border px-4"
              on:click={() => act(selectedId, state as any)}
              >{$adkT(state)}</button
            >{/each}
        </div>
      {:else if detailError}<p role="alert">
          {$adkT(
            "Application details could not be loaded. Close this panel and try again.",
          )}
        </p>
      {:else}<p>{$adkT("Loading application details…")}</p>{/if}
    </section>
  {/if}
  <div
    class="overflow-hidden rounded-2xl"
    style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)"
  >
    {#if $applications === undefined}
      <div class="flex items-center justify-center py-16 text-stone-500">
        <Loader2 class="h-6 w-6 animate-spin" />
      </div>
    {:else if filtered.length === 0}
      <p class="py-16 text-center text-sm text-stone-600">
        {$adkT(
          $applications.length === 0
            ? "No agent applications yet. New wizard submissions appear here instantly."
            : "No applications match your search.",
        )}
      </p>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-white/5 text-stone-400">
            <tr>
              <th class="px-6 py-4">{$adkT("Applicant")}</th>
              <th class="px-6 py-4">{$adkT("Agency")}</th>
              <th class="px-6 py-4">{$adkT("Specializations")}</th>
              <th class="px-6 py-4">{$adkT("Submitted")}</th>
              <th class="px-6 py-4">{$adkT("Status")}</th>
              <th class="px-6 py-4 text-right">{$adkT("Actions")}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            {#each filtered as app (app._id)}
              <tr class="hover:bg-white/5">
                <td class="px-6 py-4">
                  <p class="font-medium text-white">{app.fullName}</p>
                  <p class="text-xs text-stone-500">
                    {app.email} · {app.phone}
                  </p>
                  <p class="font-mono text-[10px] text-stone-600">
                    {$adkT(app.reference)}
                  </p>
                </td>
                <td class="px-6 py-4 text-stone-300"
                  >{$adkT(app.agencyName ?? "—")}<br /><span
                    class="text-xs text-stone-600"
                    >{$adkT(app.experience ?? "")} {$adkT("yrs")}</span
                  ></td
                >
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-1">
                    {#each app.specializations ?? [] as spec}
                      <span
                        class="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-stone-300"
                        >{$adkT(spec)}</span
                      >
                    {/each}
                  </div>
                </td>
                <td class="px-6 py-4 text-stone-400"
                  >{$adkT(
                    formatRelative(new Date(app.createdAt), $adkLocale),
                  )}</td
                >
                <td class="px-6 py-4">
                  <span
                    class="rounded-full px-2.5 py-1 text-xs font-semibold {REQUEST_STATUS_META[
                      app.status
                    ]?.classes ?? ''}"
                    >{$adkT(
                      REQUEST_STATUS_META[app.status]?.label ?? app.status,
                    )}</span
                  >
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end gap-2">
                    <button
                      type="button"
                      on:click={() => openApplication(app)}
                      class="min-h-[44px] rounded-lg border px-3"
                      >{$adkT("View verification details")}</button
                    >
                    <button
                      on:click={() => {
                        openApplication(app);
                        error =
                          "Open the verification details and record physical confirmation before approval.";
                      }}
                      disabled={actingId === String(app._id)}
                      class="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                    >
                      {#if actingId === String(app._id)}<Loader2
                          size={12}
                          class="animate-spin"
                        />{:else}<CheckCircle size={12} />{/if}
                      {$adkT("Approve")}
                    </button>
                    <button
                      on:click={() => openApplication(app)}
                      disabled={actingId === String(app._id)}
                      class="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
                    >
                      <XCircle size={12} />
                      {$adkT("Reject")}
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
