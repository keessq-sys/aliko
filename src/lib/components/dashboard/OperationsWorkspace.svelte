<script lang="ts">
  import { api } from "$lib/convex/_generated/api";
  import { useQuery, runMutation } from "$lib/convex/queries";
  export let kind: any = "WORK_ORDER";
  export let title = "Records";
  let records = useQuery(api.management.listRecords, { kind });
  $: records = useQuery(api.management.listRecords, { kind });
  let recordTitle = "";
  let detail = "";
  let contact = "";
  let amount = 0;
  let dueDate = "";
  let error = "";
  let saving = false;
  async function save() {
    saving = true;
    error = "";
    try {
      await runMutation(api.management.saveRecord, {
        kind,
        title: recordTitle,
        detail,
        contact,
        amount,
        dueDate,
        status: "OPEN",
      });
      recordTitle = "";
      detail = "";
    } catch (e) {
      error = e instanceof Error ? e.message : "Could not save";
    } finally {
      saving = false;
    }
  }
  async function update(row: any, status: any) {
    try {
      await runMutation(api.management.saveRecord, {
        id: row._id,
        kind: row.kind,
        title: row.title,
        detail: row.detail,
        amount: row.amount,
        contact: row.contact,
        dueDate: row.dueDate,
        paymentId: row.paymentId,
        status,
      });
    } catch (e) {
      error = e instanceof Error ? e.message : "Could not update";
    }
  }
</script>

<section class="theme-surface rounded-2xl border border-white/10 p-6">
  <h2 class="theme-text text-xl font-semibold">{title}</h2>
  {#if kind !== "COMMISSION"}
    <form
      on:submit|preventDefault={save}
      class="my-5 grid gap-3 sm:grid-cols-2"
    >
      <label class="text-sm"
        >Title<input
          required
          bind:value={recordTitle}
          class="theme-input mt-1 w-full rounded-lg border p-3"
          maxlength="180"
        /></label
      >
      <label class="text-sm"
        >Contact or recipient<input
          bind:value={contact}
          class="theme-input mt-1 w-full rounded-lg border p-3"
        /></label
      >
      <label class="text-sm"
        >Amount (₦)<input
          type="number"
          min="0"
          bind:value={amount}
          class="theme-input mt-1 w-full rounded-lg border p-3"
        /></label
      >
      <label class="text-sm"
        >Due date<input
          type="date"
          bind:value={dueDate}
          class="theme-input mt-1 w-full rounded-lg border p-3"
        /></label
      >
      <label class="sm:col-span-2 text-sm"
        >Details<textarea
          required
          bind:value={detail}
          class="theme-input mt-1 w-full rounded-lg border p-3"
          rows="3"
          maxlength="10000"
        ></textarea></label
      >
      <button
        disabled={saving}
        class="min-h-[44px] rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white"
        >{saving ? "Saving…" : "Save record"}</button
      >
    </form>
  {:else}<p class="my-4 text-sm">
      Commissions appear here after an administrator records a verified payment
      and approves the amount.
    </p>{/if}
  {#if error}<p role="alert" class="my-3 text-rose-600">{error}</p>{/if}
  {#if $records === undefined}<p class="py-6">
      Loading your records…
    </p>{:else if !$records.length}<p class="py-6">No records yet.</p>{:else}
    <div class="space-y-3">
      {#each $records as row}<article
          class="rounded-xl border border-white/10 p-4"
        >
          <div class="flex flex-wrap justify-between gap-3">
            <h3 class="theme-text font-semibold">{row.title}</h3>
            <span class="text-sm">{row.status.replace("_", " ")}</span>
          </div>
          <p class="my-2 whitespace-pre-wrap text-sm">{row.detail}</p>
          <p class="text-xs">
            {row.contact ?? ""}
            {row.dueDate ?? ""}
            {row.amount ? `₦${row.amount.toLocaleString()}` : ""}
          </p>
          {#if kind !== "COMMISSION"}<div class="mt-3 flex gap-3">
              <button
                class="min-h-[44px] rounded-lg border px-3"
                on:click={() => update(row, "IN_PROGRESS")}>In progress</button
              ><button
                class="min-h-[44px] rounded-lg border px-3"
                on:click={() => update(row, "COMPLETED")}>Complete</button
              ><button
                class="min-h-[44px] rounded-lg border px-3"
                on:click={() => update(row, "CANCELLED")}>Cancel</button
              >
            </div>{/if}
        </article>{/each}
    </div>{/if}
</section>
