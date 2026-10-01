<script lang="ts">
  import { api } from "$lib/convex/_generated/api";
  import { useQuery, runMutation } from "$lib/convex/queries";
  import ScannedAttachments from "./ScannedAttachments.svelte";
  import MessageDesk from "./MessageDesk.svelte";
  import RecordFiles from "./RecordFiles.svelte";
  export let kind: any = "WORK_ORDER";
  export let title = "Records";
  let cursor: string | null = null;
  $: records = useQuery(
    kind === "MESSAGE" ? null : api.management.pageRecords,
    { kind, paginationOpts: { cursor, numItems: 25 } },
  );
  const vendors = useQuery(api.management.listRecords, { kind: "VENDOR" });
  const properties = useQuery(api.properties.getManageableProperties, {});
  let id: any = undefined,
    recordTitle = "",
    detail = "",
    contact = "",
    amount = 0,
    dueDate = "",
    status: any = "OPEN",
    vendorId: any = "",
    propertyId: any = "",
    attachmentIds: any[] = [],
    error = "",
    saving = false;
  function reset() {
    id = undefined;
    recordTitle = "";
    detail = "";
    contact = "";
    amount = 0;
    dueDate = "";
    status = "OPEN";
    vendorId = "";
    propertyId = "";
    attachmentIds = [];
  }
  function edit(row: any) {
    id = row._id;
    recordTitle = row.title;
    detail = row.detail;
    contact = row.contact ?? "";
    amount = row.amount ?? 0;
    dueDate = row.dueDate ?? "";
    status = row.status;
    vendorId = row.vendorId ?? "";
    propertyId = row.propertyId ?? "";
    attachmentIds = row.attachmentIds ?? [];
  }
  async function save() {
    saving = true;
    error = "";
    try {
      await runMutation(api.management.saveRecord, {
        id,
        kind,
        title: recordTitle,
        detail,
        contact,
        amount,
        dueDate,
        status,
        vendorId: vendorId || undefined,
        propertyId: propertyId || undefined,
        attachmentIds,
      });
      reset();
      cursor = null;
    } catch (e) {
      error = e instanceof Error ? e.message : "Could not save";
    } finally {
      saving = false;
    }
  }
</script>

{#if kind === "MESSAGE"}<MessageDesk />{:else}<section
    class="theme-surface theme-text rounded-2xl border p-6 space-y-4"
  >
    <h2 class="text-xl font-semibold">{title}</h2>
    <a href="/dashboard/operations" class="underline block py-2"
      >Leases, occupancy and financial ledger</a
    >{#if error}<p role="alert" class="text-rose-600">{error}</p>{/if}
    {#if kind !== "COMMISSION"}<form
        on:submit|preventDefault={save}
        class="grid gap-3 sm:grid-cols-2"
      >
        <label
          >Title<input
            required
            minlength="3"
            maxlength="180"
            bind:value={recordTitle}
            class="theme-input block w-full border rounded p-3"
          /></label
        ><label
          >Contact<input
            maxlength="254"
            bind:value={contact}
            class="theme-input block w-full border rounded p-3"
          /></label
        ><label
          >Amount (₦)<input
            type="number"
            min="0"
            step="0.01"
            bind:value={amount}
            class="theme-input block w-full border rounded p-3"
          /></label
        ><label
          >Due date<input
            type="date"
            bind:value={dueDate}
            class="theme-input block w-full border rounded p-3"
          /></label
        >
        {#if kind === "WORK_ORDER"}<label
            >Assigned vendor<select
              bind:value={vendorId}
              class="theme-input block w-full border rounded p-3"
              ><option value="">Unassigned</option
              >{#each ($vendors ?? []).filter((v) => v.status !== "CANCELLED") as vendor}<option
                  value={vendor._id}>{vendor.title}</option
                >{/each}</select
            ></label
          >{/if}
        <label
          >Property<select
            bind:value={propertyId}
            class="theme-input block w-full border rounded p-3"
            ><option value="">No linked property</option
            >{#each $properties ?? [] as property}<option value={property._id}
                >{property.title}</option
              >{/each}</select
          ></label
        ><label
          >Status<select
            bind:value={status}
            class="theme-input block w-full border rounded p-3"
            ><option>OPEN</option><option>IN_PROGRESS</option><option
              >COMPLETED</option
            ><option>CANCELLED</option></select
          ></label
        ><label class="sm:col-span-2"
          >Details<textarea
            required
            maxlength="10000"
            bind:value={detail}
            class="theme-input block w-full border rounded p-3"
            rows="3"
          ></textarea></label
        >
        <div class="sm:col-span-2">
          <ScannedAttachments bind:selected={attachmentIds} />
        </div>
        <button
          disabled={saving}
          class="min-h-[44px] rounded bg-emerald-700 text-white p-3"
          >{id ? "Save changes" : "Create record"}</button
        ><button
          type="button"
          on:click={reset}
          class="min-h-[44px] border rounded p-3">Clear form</button
        >
      </form>{:else}<p>
        Commissions require administrator approval against a verified payment.
      </p>{/if}
    {#if $records === undefined}<p>
        Loading records…
      </p>{:else if !$records.page.length}<p>No records yet.</p>{/if}
    {#each $records?.page ?? [] as row}<article
        class="border rounded-xl p-4 space-y-2"
      >
        <h3 class="font-semibold">{row.title}</h3>
        <p>{row.status.replaceAll("_", " ")}</p>
        <p class="whitespace-pre-wrap">{row.detail}</p>
        <p>
          {row.contact ?? ""} · {row.dueDate ?? ""} · ₦{(
            row.amount ?? 0
          ).toLocaleString()}
        </p>
        <RecordFiles recordId={row._id} />{#if kind !== "COMMISSION"}<button
            class="border rounded px-3 min-h-[44px]"
            on:click={() => edit(row)}>Edit record</button
          >{/if}
      </article>{/each}
    <div class="flex gap-3">
      <button
        class="border rounded px-3 min-h-[44px]"
        disabled={!cursor}
        on:click={() => (cursor = null)}>Latest records</button
      ><button
        class="border rounded px-3 min-h-[44px]"
        disabled={!$records || $records.isDone}
        on:click={() => (cursor = $records?.continueCursor ?? null)}
        >Older records</button
      >
    </div>
  </section>{/if}
