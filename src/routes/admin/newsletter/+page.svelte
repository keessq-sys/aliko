<script lang="ts">
  import { api } from "$lib/convex/_generated/api";
  import { useQuery, runMutation } from "$lib/convex/queries";
  let cursor: string | null = null,
    error = "",
    busy = "",
    queryError = "",
    retry = 0;
  function loadSubscriptions(cursor: string | null, _retry: number) {
    queryError = "";
    return useQuery(
      api.newsletter.list,
      { paginationOpts: { numItems: 50, cursor } },
      () => {
        queryError = "Subscriptions could not be loaded.";
      },
    );
  }
  $: subscriptions = loadSubscriptions(cursor, retry);
  async function unsubscribe(id: any) {
    busy = id;
    error = "";
    try {
      await runMutation(api.newsletter.unsubscribe, { id });
    } catch {
      error = "Could not update subscription. Please retry.";
    } finally {
      busy = "";
    }
  }
</script>

<svelte:head><title>Newsletter consent | Admin Console</title></svelte:head>
<section class="workspace-page">
  <h1>Newsletter subscriptions</h1>
  <p>
    Consent records for listing emails. A saved subscription is not proof of
    email delivery. Honour removal requests before exporting or sending
    campaigns.
  </p>
  {#if error}<p role="alert">{error}</p>{/if}
  {#if queryError}<p role="alert">{queryError}</p>
    <button class="btn-primary" on:click={() => retry++}>Retry</button
    >{:else if !$subscriptions}<p role="status">
      Loading subscriptions…
    </p>{:else if !$subscriptions.page.length}<p>
      No subscriptions on this page.
    </p>{:else}<div class="overflow-x-auto">
      <table>
        <thead
          ><tr
            ><th>Email</th><th>Consent date</th><th>Status</th><th>Action</th
            ></tr
          ></thead
        ><tbody
          >{#each $subscriptions.page as row}<tr
              ><td>{row.email}</td><td
                >{new Date(row.consentedAt).toLocaleDateString()}</td
              ><td>{row.status}</td><td
                ><button
                  class="btn-primary"
                  disabled={busy === row._id || row.status === "UNSUBSCRIBED"}
                  on:click={() => unsubscribe(row._id)}>Unsubscribe</button
                ></td
              ></tr
            >{/each}</tbody
        >
      </table>
    </div>{/if}
  {#if $subscriptions && !$subscriptions.isDone}<button
      class="btn-primary"
      on:click={() => (cursor = $subscriptions!.continueCursor)}
      >Next page</button
    >{/if}
</section>
