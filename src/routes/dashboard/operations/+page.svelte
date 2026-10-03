<script lang="ts">
  import { getI18n } from "$lib/i18n";
  const { locale: adkLocale } = getI18n();

  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();

  import { api } from "$lib/convex/_generated/api";
  import { useQuery, runMutation } from "$lib/convex/queries";
  import ScannedAttachments from "$lib/components/dashboard/ScannedAttachments.svelte";
  const properties = useQuery(api.properties.getManageableProperties, {});
  let cursor: string | null = null,
    ledgerCursor: string | null = null;
  $: leases = useQuery(api.estateOperations.leases, {
    paginationOpts: { cursor, numItems: 25 },
  });
  $: ledger = useQuery(api.estateOperations.ledger, {
    paginationOpts: { cursor: ledgerCursor, numItems: 25 },
  });
  let id: any = undefined,
    propertyId: any = "",
    tenantId: any = undefined,
    tenantEmail = "",
    unit = "",
    startDate = "",
    endDate = "",
    rent = 0,
    deposit = 0,
    status: any = "DRAFT",
    attachments: any[] = [],
    error = "",
    busy = false;
  let leaseId: any = "",
    direction: any = "INCOME",
    amount = 0,
    reference = "",
    description = "";
  function edit(row: any) {
    id = row._id;
    propertyId = row.propertyId;
    tenantId = row.tenantId;
    unit = row.unit;
    startDate = row.startDate;
    endDate = row.endDate;
    rent = row.rent;
    deposit = row.deposit;
    status = row.status;
    attachments = row.attachmentIds;
  }
  function reset() {
    id = undefined;
    propertyId = "";
    tenantId = undefined;
    tenantEmail = "";
    unit = "";
    startDate = "";
    endDate = "";
    rent = 0;
    deposit = 0;
    status = "DRAFT";
    attachments = [];
  }
  async function save() {
    busy = true;
    error = "";
    try {
      const tenant = tenantId
        ? { _id: tenantId }
        : await runMutation(api.estateOperations.resolveTenant, {
            email: tenantEmail,
          });
      await runMutation(api.estateOperations.saveLease, {
        id,
        propertyId,
        tenantId: tenant._id,
        unit,
        startDate,
        endDate,
        rent,
        deposit,
        status,
        attachmentIds: attachments,
      });
      reset();
      cursor = null;
    } catch (e) {
      error = e instanceof Error ? e.message : "Could not save lease";
    } finally {
      busy = false;
    }
  }
  async function post() {
    busy = true;
    error = "";
    try {
      await runMutation(api.estateOperations.postLedger, {
        leaseId,
        direction,
        amountMinor: Math.round(amount * 100),
        reference,
        description,
      });
      reference = "";
      description = "";
      amount = 0;
      ledgerCursor = null;
    } catch (e) {
      error = e instanceof Error ? e.message : "Could not post entry";
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>{$adkT("Estate operations | Aliko Diamond Key")}</title></svelte:head>
<main class="theme-text container mx-auto px-4 pt-28 pb-12 space-y-8">
  <h1 class="text-3xl font-semibold">{$adkT("Leases, occupancy and ledger")}</h1>
  <a href="/dashboard/manager" class="underline">{$adkT("Manager dashboard")}</a
  >{#if error}<p role="alert">{$adkT(error)}</p>{/if}
  <section class="theme-surface p-5 border rounded-xl space-y-4">
    <h2 class="text-xl">{$adkT("Lease register")}</h2>
    <form on:submit|preventDefault={save} class="grid sm:grid-cols-2 gap-3">
      <label
        >{$adkT("Property")}<select
          required
          bind:value={propertyId}
          class="theme-input block w-full border rounded p-3"
          ><option value="">{$adkT("Select property")}</option
          >{#each $properties ?? [] as property}<option value={property._id}
              >{$adkT(property.title)}</option
            >{/each}</select
        ></label
      >{#if !tenantId}<label
          >{$adkT("Tenant account email")}<input dir="auto"
            type="email"
            required
            bind:value={tenantEmail}
            class="theme-input block w-full border rounded p-3"
          /></label
        >{:else}<p>{$adkT("Tenant account remains linked to this lease.")}</p>{/if}<label
        >{$adkT("Unit identifier")}<input dir="auto"
          required
          maxlength="80"
          bind:value={unit}
          class="theme-input block w-full border rounded p-3"
        /></label
      ><label
        >{$adkT("Status")}<select
          bind:value={status}
          class="theme-input block w-full border rounded p-3"
          ><option>{$adkT("DRAFT")}</option><option>{$adkT("ACTIVE")}</option><option>{$adkT("ENDED")}</option
          ></select
        ></label
      ><label
        >{$adkT("Start date")}<input dir="auto"
          type="date"
          required
          bind:value={startDate}
          class="theme-input block w-full border rounded p-3"
        /></label
      ><label
        >{$adkT("End date")}<input dir="auto"
          type="date"
          required
          bind:value={endDate}
          class="theme-input block w-full border rounded p-3"
        /></label
      ><label
        >{$adkT("Rent (₦)")}<input dir="auto"
          type="number"
          min="0"
          step="0.01"
          required
          bind:value={rent}
          class="theme-input block w-full border rounded p-3"
        /></label
      ><label
        >{$adkT("Deposit (₦)")}<input dir="auto"
          type="number"
          min="0"
          step="0.01"
          required
          bind:value={deposit}
          class="theme-input block w-full border rounded p-3"
        /></label
      >
      <div class="sm:col-span-2">
        <ScannedAttachments bind:selected={attachments} />
      </div>
      <button
        disabled={busy}
        class="rounded min-h-[44px] p-3 bg-emerald-700 text-white"
        >{$adkT("Save lease")}</button
      ><button
        type="button"
        on:click={reset}
        class="rounded min-h-[44px] p-3 border">{$adkT("New lease")}</button
      >
    </form>
    {#each $leases?.page ?? [] as lease}<article class="border rounded p-3">
        <h3>{$adkT("Unit")} {$adkT(lease.unit)} · {$adkT(lease.status)}</h3>
        <p>
          {$adkT(lease.startDate)} {$adkT("to")} {$adkT(lease.endDate)} · ₦{$adkT(lease.rent.toLocaleString($adkLocale === "ar" ? "ar-NG" : "en-NG"))}
        </p>
        <button
          on:click={() => edit(lease)}
          class="min-h-[44px] border rounded px-3">{$adkT("Edit lease")}</button
        >
      </article>{/each}<button
      class="min-h-[44px] border rounded px-3"
      disabled={!cursor}
      on:click={() => (cursor = null)}>{$adkT("Latest leases")}</button
    ><button
      class="min-h-[44px] border rounded px-3"
      disabled={!$leases || $leases.isDone}
      on:click={() => (cursor = $leases?.continueCursor ?? null)}
      >{$adkT("Older leases")}</button
    >
  </section>
  <section class="theme-surface border rounded-xl p-5 space-y-4">
    <h2 class="text-xl">{$adkT("Financial ledger")}</h2>
    <p> {$adkT("Entries record estate income and expenses. They do not certify provider payments. Posted entries are immutable; use a separately referenced correction entry.")} </p>
    <form on:submit|preventDefault={post} class="grid sm:grid-cols-2 gap-3">
      <label
        >{$adkT("Lease")}<select
          required
          bind:value={leaseId}
          class="theme-input block w-full border rounded p-3"
          ><option value="">{$adkT("Select lease from the displayed page")}</option
          >{#each $leases?.page ?? [] as lease}<option value={lease._id}
              >{$adkT("Unit")} {$adkT(lease.unit)} · {$adkT(lease.startDate)}</option
            >{/each}</select
        ></label
      ><label
        >{$adkT("Entry type")}<select
          bind:value={direction}
          class="theme-input block w-full border rounded p-3"
          ><option>{$adkT("INCOME")}</option><option>{$adkT("EXPENSE")}</option></select
        ></label
      ><label
        >{$adkT("Amount (₦)")}<input dir="auto"
          type="number"
          min="0.01"
          step="0.01"
          required
          bind:value={amount}
          class="theme-input block w-full border rounded p-3"
        /></label
      ><label
        >{$adkT("Receipt reference")}<input dir="auto"
          required
          minlength="3"
          maxlength="120"
          bind:value={reference}
          class="theme-input block w-full border rounded p-3"
        /></label
      ><label
        >{$adkT("Description")}<input dir="auto"
          required
          maxlength="1000"
          bind:value={description}
          class="theme-input block w-full border rounded p-3"
        /></label
      ><button
        disabled={busy}
        class="min-h-[44px] bg-emerald-700 text-white rounded p-3"
        >{$adkT("Post entry")}</button
      >
    </form>
    {#each $ledger?.page ?? [] as entry}<article class="border rounded p-3">
        <p>
          {$adkT(entry.reference)} · {$adkT(entry.direction)} · ₦{$adkT((
            entry.amountMinor / 100
          ).toLocaleString($adkLocale === "ar" ? "ar-NG" : "en-NG"))}
        </p>
        <p>{$adkT(entry.description)}</p>
      </article>{/each}<button
      class="min-h-[44px] border rounded px-3"
      disabled={!ledgerCursor}
      on:click={() => (ledgerCursor = null)}>{$adkT("Latest entries")}</button
    ><button
      class="min-h-[44px] border rounded px-3"
      disabled={!$ledger || $ledger.isDone}
      on:click={() => (ledgerCursor = $ledger?.continueCursor ?? null)}
      >{$adkT("Older entries")}</button
    >
  </section>
</main>
