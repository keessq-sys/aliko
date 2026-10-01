<script lang="ts">
  import { api } from "$lib/convex/_generated/api";
  import { useQuery, runMutation } from "$lib/convex/queries";
  let cursor: string | null = null,
    id: any = undefined,
    author = "",
    quote = "",
    location = "",
    consentReference = "",
    approved = false,
    error = "",
    busy = false;
  $: queue = useQuery(api.content.reviewQueue, {
    paginationOpts: { numItems: 20, cursor },
  });
  async function save() {
    busy = true;
    error = "";
    try {
      await runMutation(api.content.saveTestimonial, {
        id,
        author,
        quote,
        location,
        consentReference,
        approved,
      });
      id = undefined;
      author = "";
      quote = "";
      location = "";
      consentReference = "";
      approved = false;
      cursor = null;
    } catch (e) {
      error = e instanceof Error ? e.message : "Save failed";
    } finally {
      busy = false;
    }
  }
  function edit(row: any) {
    id = row._id;
    author = row.author;
    quote = row.quote;
    location = row.location;
    consentReference = row.consentReference;
    approved = row.approved;
  }
</script>

<section class="theme-surface theme-text m-5 p-5 rounded-xl border space-y-4">
  <h1 class="text-2xl">Testimonial publication review</h1>
  <p>
    Publish only genuine customer statements with a recorded consent reference.
    Do not invent customer identities or results.
  </p>
  {#if error}<p role="alert">{error}</p>{/if}
  <form on:submit|preventDefault={save} class="grid gap-3">
    <label
      >Author display name<input
        required
        maxlength="120"
        bind:value={author}
        class="theme-input block border rounded p-3 w-full"
      /></label
    ><label
      >Location<input
        maxlength="120"
        bind:value={location}
        class="theme-input block border rounded p-3 w-full"
      /></label
    ><label
      >Customer statement<textarea
        required
        maxlength="1500"
        bind:value={quote}
        class="theme-input block border rounded p-3 w-full"
      ></textarea></label
    ><label
      >Recorded publication consent reference<input
        required
        minlength="5"
        maxlength="300"
        bind:value={consentReference}
        class="theme-input block border rounded p-3 w-full"
      /></label
    ><label
      ><input type="checkbox" bind:checked={approved} /> Approved for publication</label
    ><button disabled={busy} class="min-h-[44px] border rounded px-3"
      >Save review</button
    >
  </form>
  {#each $queue?.page ?? [] as row}<article class="border rounded p-3">
      <p>{row.author} · {row.approved ? "Published" : "Unpublished"}</p>
      <p>{row.quote}</p>
      <button
        class="min-h-[44px] border rounded px-3"
        on:click={() => edit(row)}>Edit review</button
      >
    </article>{/each}<button
    disabled={!$queue || $queue.isDone}
    on:click={() => (cursor = $queue?.continueCursor ?? null)}
    class="min-h-[44px] border rounded px-3">Older reviews</button
  >
</section>
