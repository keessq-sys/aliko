<script lang="ts">
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

<svelte:head><title>Estate operations | Aliko Diamond Key</title></svelte:head>
<main class="theme-text container mx-auto px-4 pt-28 pb-12 space-y-8">
  <h1 class="text-3xl font-semibold">Leases, occupancy and ledger</h1>
  <a href="/dashboard/manager" class="underline">Manager dashboard</a
  >{#if error}<p role="alert">{error}</p>{/if}
  <section class="theme-surface p-5 border rounded-xl space-y-4">
    <h2 class="text-xl">Lease register</h2>
    <form on:submit|preventDefault={save} class="grid sm:grid-cols-2 gap-3">
      <label
        >Property<select
          required
          bind:value={propertyId}
          class="theme-input block w-full border rounded p-3"
          ><option value="">Select property</option
          >{#each $properties ?? [] as property}<option value={property._id}
              >{property.title}</option
            >{/each}</select
        ></label
      >{#if !tenantId}<label
          >Tenant account email<input
            type="email"
            required
            bind:value={tenantEmail}
            class="theme-input block w-full border rounded p-3"
          /></label
        >{:else}<p>Tenant account remains linked to this lease.</p>{/if}<label
        >Unit identifier<input
          required
          maxlength="80"
          bind:value={unit}
          class="theme-input block w-full border rounded p-3"
        /></label
      ><label
        >Status<select
          bind:value={status}
          class="theme-input block w-full border rounded p-3"
          ><option>DRAFT</option><option>ACTIVE</option><option>ENDED</option
          ></select
        ></label
      ><label
        >Start date<input
          type="date"
          required
          bind:value={startDate}
          class="theme-input block w-full border rounded p-3"
        /></label
      ><label
        >End date<input
          type="date"
          required
          bind:value={endDate}
          class="theme-input block w-full border rounded p-3"
        /></label
      ><label
        >Rent (₦)<input
          type="number"
          min="0"
          step="0.01"
          required
          bind:value={rent}
          class="theme-input block w-full border rounded p-3"
        /></label
      ><label
        >Deposit (₦)<input
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
        >Save lease</button
      ><button
        type="button"
        on:click={reset}
        class="rounded min-h-[44px] p-3 border">New lease</button
      >
    </form>
    {#each $leases?.page ?? [] as lease}<article class="border rounded p-3">
        <h3>Unit {lease.unit} · {lease.status}</h3>
        <p>
          {lease.startDate} to {lease.endDate} · ₦{lease.rent.toLocaleString()}
        </p>
        <button
          on:click={() => edit(lease)}
          class="min-h-[44px] border rounded px-3">Edit lease</button
        >
      </article>{/each}<button
      class="min-h-[44px] border rounded px-3"
      disabled={!cursor}
      on:click={() => (cursor = null)}>Latest leases</button
    ><button
      class="min-h-[44px] border rounded px-3"
      disabled={!$leases || $leases.isDone}
      on:click={() => (cursor = $leases?.continueCursor ?? null)}
      >Older leases</button
    >
  </section>
  <section class="theme-surface border rounded-xl p-5 space-y-4">
    <h2 class="text-xl">Financial ledger</h2>
    <p>
      Entries record estate income and expenses. They do not certify provider
      payments. Posted entries are immutable; use a separately referenced
      correction entry.
    </p>
    <form on:submit|preventDefault={post} class="grid sm:grid-cols-2 gap-3">
      <label
        >Lease<select
          required
          bind:value={leaseId}
          class="theme-input block w-full border rounded p-3"
          ><option value="">Select lease from the displayed page</option
          >{#each $leases?.page ?? [] as lease}<option value={lease._id}
              >Unit {lease.unit} · {lease.startDate}</option
            >{/each}</select
        ></label
      ><label
        >Entry type<select
          bind:value={direction}
          class="theme-input block w-full border rounded p-3"
          ><option>INCOME</option><option>EXPENSE</option></select
        ></label
      ><label
        >Amount (₦)<input
          type="number"
          min="0.01"
          step="0.01"
          required
          bind:value={amount}
          class="theme-input block w-full border rounded p-3"
        /></label
      ><label
        >Receipt reference<input
          required
          minlength="3"
          maxlength="120"
          bind:value={reference}
          class="theme-input block w-full border rounded p-3"
        /></label
      ><label
        >Description<input
          required
          maxlength="1000"
          bind:value={description}
          class="theme-input block w-full border rounded p-3"
        /></label
      ><button
        disabled={busy}
        class="min-h-[44px] bg-emerald-700 text-white rounded p-3"
        >Post entry</button
      >
    </form>
    {#each $ledger?.page ?? [] as entry}<article class="border rounded p-3">
        <p>
          {entry.reference} · {entry.direction} · ₦{(
            entry.amountMinor / 100
          ).toLocaleString()}
        </p>
        <p>{entry.description}</p>
      </article>{/each}<button
      class="min-h-[44px] border rounded px-3"
      disabled={!ledgerCursor}
      on:click={() => (ledgerCursor = null)}>Latest entries</button
    ><button
      class="min-h-[44px] border rounded px-3"
      disabled={!$ledger || $ledger.isDone}
      on:click={() => (ledgerCursor = $ledger?.continueCursor ?? null)}
      >Older entries</button
    >
  </section>
</main>
