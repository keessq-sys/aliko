<script lang="ts">
  import { api } from "$lib/convex/_generated/api";
  import { useQuery, runAction, runMutation } from "$lib/convex/queries";
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();
  export let orders: any[] = [];
  let refundCursor: string | null = null, reportCursor: string | null = null;
  $: refunds = useQuery(api.korapayOperations.refunds, { paginationOpts: { cursor: refundCursor, numItems: 25 } });
  $: reports = useQuery(api.korapayOperations.settlementReports, { paginationOpts: { cursor: reportCursor, numItems: 25 } });
  let orderId = "", reason = "", busy = false, error = "", message = "";
  let batchReference = "", evidenceReference = "", settledDate = "", reportFile: File | null = null;
  async function refund() {
    const order = orders.find(o => o._id === orderId);
    if (!order || !confirm(`Request a full refund of NGN ${order.amount} for ${order.reference}? This cannot reverse legal title or completed services.`)) return;
    busy = true; error = ""; message = "";
    try {
      const result = await runAction(api.korapayOperations.initiateRefund, { orderId: orderId as any, reason });
      message = `${result.reference}: ${result.status}. Pending outcomes must be reconciled; do not issue a replacement refund.`;
    } catch(e) { error = e instanceof Error ? e.message : "Refund could not be requested."; } finally { busy = false; }
  }
  async function reconcile(reference: string) {
    busy = true; error = "";
    try { message = `${reference}: ${await runAction(api.korapayOperations.reconcileRefund, { reference })}`; }
    catch(e) { error = e instanceof Error ? e.message : "Provider confirmation unavailable."; } finally { busy = false; }
  }
  async function importReport() {
    busy = true; error = ""; message = "";
    try {
      if (!reportFile || reportFile.size > 100000) throw new Error("Choose a CSV report smaller than 100 KB.");
      const lines = (await reportFile.text()).trim().split(/\r?\n/);
      if (lines.shift()?.replace(/^\uFEFF/, "").trim() !== "payment_reference,gross,fees,net") throw new Error("CSV header must be payment_reference,gross,fees,net");
      const rows = lines.map(line => {
        const cells = line.split(",").map(s => s.trim());
        if (cells.length !== 4 || !cells[0] || cells.slice(1).some(s => !/^\d+(\.\d{1,2})?$/.test(s))) throw new Error("Use one reference and three non-negative amounts per CSV row, without quotes or thousands separators.");
        return { paymentReference: cells[0], gross: Number(cells[1]), fees: Number(cells[2]), net: Number(cells[3]) };
      });
      await runMutation(api.korapayOperations.importSettlementReport, { batchReference, evidenceReference, settledAt: Date.parse(`${settledDate}T00:00:00Z`), rows });
      message = "Settlement report matched and recorded. Bank credit has not been independently verified.";
    } catch(e) { error = e instanceof Error ? e.message : "Import failed."; } finally { busy = false; }
  }
</script>

<section class="theme-surface theme-text m-5 rounded-xl border p-5 space-y-5" aria-labelledby="korapay-finance-title">
  <h2 id="korapay-finance-title" class="text-2xl font-semibold">{$adkT("Korapay refunds and settlement reports")}</h2>
  <p>{$adkT("Full refunds require a matching live payment. Pending refunds remain reserved until Korapay confirms their outcome. Allocated land requires manual legal review.")}</p>
  {#if error}<p role="alert" class="theme-error">{$adkT(error)}</p>{/if}
  {#if message}<p role="status">{$adkT(message)}</p>{/if}
  <form on:submit|preventDefault={refund} class="grid gap-3 md:grid-cols-2">
    <label>{$adkT("Paid order")}<select required class="theme-input block w-full rounded-lg p-3" bind:value={orderId}>
      <option value="">{$adkT("Select an order from the current payments page")}</option>
      {#each orders.filter(o => o.status === "PAID" && o.attempt?.provider === "KORAPAY") as order}<option value={order._id}>{order.title} · NGN {order.amount} · {order.reference}</option>{/each}
    </select></label>
    <label>{$adkT("Refund reason")}<input required minlength="5" maxlength="200" class="theme-input block w-full rounded-lg p-3" bind:value={reason} /></label>
    <button disabled={busy} class="btn-primary min-h-[44px]">{$adkT("Request full Korapay refund")}</button>
  </form>
  {#if !$refunds}<p role="status">{$adkT("Loading refunds…")}</p>{:else if !$refunds.page.length}<p>{$adkT("No Korapay refunds recorded.")}</p>{/if}
  {#each $refunds?.page ?? [] as row}<article class="rounded-lg border p-3 break-words"><p>{row.reference} · NGN {row.amount} · {$adkT(row.status)}</p><p>{$adkT(row.lastError ?? "")}</p>
    {#if row.status === "PENDING"}<button disabled={busy} class="min-h-[44px] underline" on:click={() => reconcile(row.reference)}>{$adkT("Verify refund with Korapay")}</button>{/if}</article>{/each}
  {#if $refunds && !$refunds.isDone}<button class="min-h-[44px] underline" on:click={() => refundCursor = $refunds!.continueCursor}>{$adkT("Older Korapay refunds")}</button>{/if}
  <h3 class="text-xl font-semibold">{$adkT("Import a merchant settlement report")}</h3>
  <p>{$adkT("Export the settlement details from the Korapay merchant dashboard. Normalize the CSV to payment_reference,gross,fees,net using NGN amounts. Each report supports 1–100 live charges. The report and evidence reference are audited; this does not certify bank receipt.")}</p>
  <form on:submit|preventDefault={importReport} class="grid gap-3 md:grid-cols-2">
    <label>{$adkT("Settlement batch reference")}<input required maxlength="100" bind:value={batchReference} class="theme-input block w-full rounded-lg p-3" /></label>
    <label>{$adkT("Evidence reference or operations ticket")}<input required minlength="5" maxlength="300" bind:value={evidenceReference} class="theme-input block w-full rounded-lg p-3" /></label>
    <label>{$adkT("Reported settlement date")}<input required type="date" bind:value={settledDate} class="theme-input block w-full rounded-lg p-3" /></label>
    <label>{$adkT("Settlement CSV")}<input required type="file" accept=".csv,text/csv" on:change={e => reportFile = e.currentTarget.files?.[0] ?? null} class="theme-input block w-full rounded-lg p-3" /></label>
    <button disabled={busy} class="btn-primary min-h-[44px]">{$adkT("Validate and import settlement report")}</button>
  </form>
  {#if !$reports}<p role="status">{$adkT("Loading settlement reports…")}</p>{:else if !$reports.page.length}<p>{$adkT("No Korapay settlement reports recorded.")}</p>{/if}
  {#each $reports?.page ?? [] as row}<article class="rounded-lg border p-3 break-words"><p>{row.batchReference} · NGN {row.netMinor / 100} · {row.transactionCount} {$adkT("transactions")}</p><p>{$adkT("Reported — bank credit not independently verified")}</p><p>{row.evidenceReference}</p></article>{/each}
  {#if $reports && !$reports.isDone}<button class="min-h-[44px] underline" on:click={() => reportCursor = $reports!.continueCursor}>{$adkT("Older Korapay reports")}</button>{/if}
</section>
