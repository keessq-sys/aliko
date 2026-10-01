<script lang="ts">
  import { api } from "$lib/convex/_generated/api";
  import { useQuery, runAction, runMutation } from "$lib/convex/queries";
  let documentId: any = "",
    requestId = "";
  let refundCursor: string | null = null,
    settlementCursor: string | null = null,
    bookingCursor: string | null = null,
    documentCursor: string | null = null;
  $: documents = useQuery(api.reconciliation.documentPage, {
    paginationOpts: { cursor: documentCursor, numItems: 30 },
  });
  $: refundRecords = useQuery(api.reconciliation.refundPage, {
    paginationOpts: { cursor: refundCursor, numItems: 30 },
  });
  $: settlementRecords = useQuery(api.reconciliation.settlementPage, {
    paginationOpts: { cursor: settlementCursor, numItems: 30 },
  });
  $: bookings = useQuery(api.reconciliation.reviewBookings, {
    paginationOpts: { cursor: bookingCursor, numItems: 30 },
  });
  let nextPage: number | null = 1;
  let selected: any = null,
    cursor: string | null = null,
    error = "",
    message = "",
    busy = false,
    from = "",
    to = "";
  $: transactions = useQuery(
    selected ? api.reconciliation.transactions : null,
    {
      settlementId: selected?._id,
      paginationOpts: { cursor, numItems: 30 },
    } as any,
  );
  async function reconcileRefund(row: any) {
    const providerRefundId = prompt(
      "Existing Flutterwave refund ID from the provider dashboard (this does not initiate another refund):",
      row.providerRefundId ?? "",
    );
    if (!providerRefundId) return;
    busy = true;
    error = "";
    try {
      const status = await runAction(api.reconciliation.reconcileRefundById, {
        refundId: row._id,
        providerRefundId,
      });
      message = `Provider refund verified: ${status}.`;
    } catch (e) {
      error = e instanceof Error ? e.message : "Could not verify refund";
    } finally {
      busy = false;
    }
  }
  async function refunds() {
    busy = true;
    error = "";
    try {
      await runAction(api.reconciliation.runRefundReconciliation, {});
      message =
        "Refund reconciliation completed. Unknown provider outcomes remain reserved.";
    } catch (e) {
      error = e instanceof Error ? e.message : "Reconciliation failed";
    } finally {
      busy = false;
    }
  }
  async function match(row: any) {
    busy = true;
    error = "";
    try {
      const result = await runAction(api.reconciliation.reconcileSettlement, {
        settlementId: row._id,
      });
      message = `Matched ${result.matched}; unmatched ${result.unmatched}; discrepancy ₦${result.discrepancyMinor / 100}.`;
      selected = row;
      cursor = null;
    } catch (e) {
      error = e instanceof Error ? e.message : "Reconciliation failed";
    } finally {
      busy = false;
    }
  }
  async function restart(row: any) {
    const reason = prompt(
      "Record the corrected issue and recovery ticket reference:",
    );
    if (!reason) return;
    busy = true;
    error = "";
    try {
      await runMutation(api.fulfillment.restartFulfillment, {
        bookingId: row._id,
        reason,
      });
      message = "Workflow restart recorded.";
    } catch (e) {
      error = e instanceof Error ? e.message : "Restart failed";
    } finally {
      busy = false;
    }
  }
  async function importSettlements() {
    busy = true;
    error = "";
    try {
      const result = await runAction(
        api.paymentOperations.importFlutterwaveSettlements,
        { from, to, page: nextPage ?? 1 },
      );
      nextPage = result.nextPage;
      message = `Imported ${result.imported} settlement headers. Reconcile each batch against its provider transaction details.`;
    } catch (e) {
      error = e instanceof Error ? e.message : "Import failed";
    } finally {
      busy = false;
    }
  }
  async function reconcileSignature() {
    busy = true;
    error = "";
    try {
      await runAction(api.legalDocuments.reconcileSignatureRequest, {
        documentId,
        requestId,
      });
      message =
        "Provider signature identity verified. Restart the booking workflow if it remains in review.";
    } catch (e) {
      error = e instanceof Error ? e.message : "Could not reconcile signature";
    } finally {
      busy = false;
    }
  }
</script>

<section class="theme-surface theme-text m-5 p-5 border rounded-xl space-y-5">
  <h1 class="text-2xl font-semibold">
    Payment reconciliation and workflow recovery
  </h1>
  <p>
    These actions require recent administrator MFA. A refund does not
    automatically reverse legal title.
  </p>
  {#if error}<p role="alert">{error}</p>{/if}{#if message}<p role="status">
      {message}
    </p>{/if}
  <button
    disabled={busy}
    on:click={refunds}
    class="min-h-[44px] border rounded p-3">Reconcile pending refunds</button
  >
  <form
    on:submit|preventDefault={importSettlements}
    class="flex flex-wrap gap-3"
  >
    <label
      >From<input
        type="date"
        required
        bind:value={from}
        on:change={() => (nextPage = 1)}
        class="theme-input block border rounded p-3"
      /></label
    ><label
      >To<input
        type="date"
        required
        bind:value={to}
        on:change={() => (nextPage = 1)}
        class="theme-input block border rounded p-3"
      /></label
    ><button disabled={busy} class="min-h-[44px] border rounded p-3"
      >Import settlement headers{nextPage && nextPage > 1
        ? ` (page ${nextPage})`
        : ""}</button
    >
  </form>
  <h2 class="text-xl">Settlements</h2>
  {#each $settlementRecords?.page ?? [] as row}<article
      class="border rounded p-3"
    >
      <p>
        {row.providerSettlementId} · {row.currency}
        {row.amount} · {row.status}
      </p>
      <button
        disabled={busy}
        on:click={() => match(row)}
        class="min-h-[44px] border rounded px-3"
        >Fetch and reconcile transactions</button
      ><button
        on:click={() => {
          selected = row;
          cursor = null;
        }}
        class="min-h-[44px] border rounded px-3">View matches</button
      >
    </article>{/each}
  {#if selected}<h3>Transactions for {selected.providerSettlementId}</h3>
    {#each $transactions?.page ?? [] as row}<article class="border rounded p-3">
        <p>
          {row.providerTransactionId} · {row.matched
            ? "Matched"
            : "Needs review"} · net {row.currency}
          {row.netMinor / 100}
        </p>
        <p>{row.reason ?? ""}</p>
      </article>{/each}<button
      disabled={!$transactions || $transactions.isDone}
      on:click={() => (cursor = $transactions?.continueCursor ?? null)}
      class="min-h-[44px] border rounded px-3">More transactions</button
    >{/if}
  <button
    class="min-h-[44px] border rounded px-3"
    disabled={!$settlementRecords || $settlementRecords.isDone}
    on:click={() =>
      (settlementCursor = $settlementRecords?.continueCursor ?? null)}
    >Older settlements</button
  >
  <h2 class="text-xl">Refunds</h2>
  {#each $refundRecords?.page ?? [] as row}<p class="border rounded p-3">
      ₦{row.amount} · {row.status} · {row.providerRefundId ??
        "Provider outcome unknown — do not resubmit"} · {row.lastError ?? ""}
    </p>
    {#if row.status === "PENDING"}<button
        disabled={busy}
        class="min-h-[44px] border rounded px-3"
        on:click={() => reconcileRefund(row)}
        >Verify existing provider refund</button
      >{/if}{/each}
  <button
    class="min-h-[44px] border rounded px-3"
    disabled={!$refundRecords || $refundRecords.isDone}
    on:click={() => (refundCursor = $refundRecords?.continueCursor ?? null)}
    >Older refunds</button
  >
  <h2 class="text-xl">Signature request reconciliation</h2>
  <form on:submit|preventDefault={reconcileSignature} class="grid gap-3">
    <label
      >Document<select
        required
        bind:value={documentId}
        class="theme-input block border rounded p-3"
        ><option value="">Select document</option
        >{#each $documents?.page ?? [] as doc}<option value={doc._id}
            >{doc.referenceCode} · {doc.signatureDispatchState ??
              doc.status}</option
          >{/each}</select
      ></label
    ><label
      >Existing Dropbox Sign request ID<input
        required
        bind:value={requestId}
        class="theme-input block border rounded p-3"
      /></label
    ><button disabled={busy} class="min-h-[44px] border rounded p-3"
      >Verify provider request</button
    >
  </form>
  <button
    class="min-h-[44px] border rounded px-3"
    disabled={!$documents || $documents.isDone}
    on:click={() => (documentCursor = $documents?.continueCursor ?? null)}
    >Older documents</button
  >
  <h2 class="text-xl">Fulfilment recovery</h2>
  {#each $bookings?.page ?? [] as row}<article class="border rounded p-3">
      <p>{row.reference} · {row.fulfillmentError}</p>
      <button
        disabled={busy}
        on:click={() => restart(row)}
        class="min-h-[44px] border rounded px-3"
        >Restart corrected workflow</button
      >
    </article>{/each}
  <button
    class="min-h-[44px] border rounded px-3"
    disabled={!$bookings || $bookings.isDone}
    on:click={() => (bookingCursor = $bookings?.continueCursor ?? null)}
    >Older recovery cases</button
  >
</section>
