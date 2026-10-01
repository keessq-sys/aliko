<script lang="ts">
  import { api } from "$lib/convex/_generated/api";
  import { useQuery } from "$lib/convex/queries";
  let table: "storedAssets" | "r2Assets" = "storedAssets",
    cursor: string | null = null;
  $: assets = useQuery(api.mediaAudit.page, {
    table,
    paginationOpts: { cursor, numItems: 30 },
  });
</script>

<svelte:head><title>Media security audit | ADK</title></svelte:head>
<section class="theme-surface theme-text p-6 rounded-xl space-y-4">
  <h1 class="text-2xl font-semibold">Media security audit</h1>
  <p>
    Active legacy files without the current decode and scan evidence need review
    before release. An empty page does not certify the external scanner.
  </p>
  <label
    >Storage<select
      class="theme-input border p-3"
      bind:value={table}
      on:change={() => (cursor = null)}
      ><option value="storedAssets">Convex uploads</option><option
        value="r2Assets">R2 images</option
      ></select
    ></label
  >
  {#if $assets === undefined}<p>
      Loading audit…
    </p>{:else if !$assets.page.length}<p>
      No registered assets on this page.
    </p>{/if}
  {#each $assets?.page ?? [] as row}<article class="border rounded p-3">
      <p>{row.fileName} — {row.status}</p>
      <p>
        {row.needsReview
          ? "Legacy evidence missing — review required"
          : (row.securityVersion ?? "Not released")}
      </p>
    </article>{/each}
  <button
    class="border rounded min-h-[44px] px-3"
    disabled={!cursor}
    on:click={() => (cursor = null)}>Newest files</button
  >
  <button
    class="border rounded min-h-[44px] px-3"
    disabled={!$assets || $assets.isDone}
    on:click={() => (cursor = $assets?.continueCursor ?? null)}
    >Older files</button
  >
</section>
