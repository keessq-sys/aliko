<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  import { runMutation } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  const adkT = getTranslation();
  export let leads: any[] = [];
  let search = "",
    status = "",
    page = 0,
    error = "",
    busy = "";
  const statuses = [
    "NEW",
    "CONTACTED",
    "QUALIFIED",
    "CONVERTED",
    "LOST",
  ] as const;
  $: filtered = leads.filter(
    (l) =>
      (!status || l.status.toUpperCase() === status) &&
      (!search ||
        `${l.name} ${l.propertyInterest}`
          .toLowerCase()
          .includes(search.toLowerCase())),
  );
  $: page = Math.min(page, Math.max(0, Math.ceil(filtered.length / 25) - 1));
  $: visible = filtered.slice(page * 25, (page + 1) * 25);
  async function update(id: any, value: string) {
    busy = id;
    error = "";
    try {
      await runMutation(api.enquiries.updateEnquiryStatus, {
        enquiryId: id,
        status: value as "NEW",
      });
    } catch (cause) {
      error =
        cause instanceof Error ? cause.message : "Could not update enquiry";
    } finally {
      busy = "";
    }
  }
</script>

<section class="theme-surface rounded-xl border p-4 space-y-4">
  <h3 class="text-lg font-semibold theme-text">{$adkT("Leads Management")}</h3>
  <div class="flex flex-wrap gap-3">
    <label class="theme-text text-sm"
      >{$adkT("Search leads...")}<input
        dir="auto"
        bind:value={search}
        on:input={() => (page = 0)}
        class="theme-input block rounded-lg border p-3 min-h-[44px]"
      /></label
    ><label class="theme-text text-sm"
      >{$adkT("Status")}<select
        bind:value={status}
        on:change={() => (page = 0)}
        class="theme-input block rounded-lg border p-3 min-h-[44px]"
        ><option value="">{$adkT("All Leads")}</option
        >{#each statuses as option}<option value={option}
            >{$adkT(option)}</option
          >{/each}</select
      ></label
    >
  </div>
  {#if error}<p role="alert" class="text-rose-500">{$adkT(error)}</p>{/if}
  <div class="overflow-x-auto">
    <table class="w-full text-sm theme-text">
      <thead
        ><tr
          >{#each ["Name", "Property", "Date", "Status", "Actions"] as heading}<th
              class="p-3 text-start">{$adkT(heading)}</th
            >{/each}</tr
        ></thead
      ><tbody
        >{#each visible as lead}<tr class="border-t"
            ><td class="p-3">{$adkT(lead.name)}</td><td class="p-3"
              >{lead.propertyInterest}</td
            ><td class="p-3">{lead.date}</td><td class="p-3"
              ><select
                aria-label={$adkT("Update enquiry status")}
                disabled={busy === lead.id}
                value={lead.status.toUpperCase()}
                on:change={(event) =>
                  update(lead.id, event.currentTarget.value)}
                class="theme-input rounded-lg border min-h-[44px] p-2"
                >{#each statuses as option}<option value={option}
                    >{$adkT(option)}</option
                  >{/each}</select
              ></td
            ><td class="p-3"
              ><a
                href="/dashboard/messages"
                class="inline-flex min-h-[44px] items-center underline"
                >{$adkT("Contact company desk")}</a
              ></td
            ></tr
          >{/each}</tbody
      >
    </table>
  </div>
  {#if !visible.length}<p class="theme-field-muted py-6 text-center">
      {$adkT("No leads found")}
    </p>{/if}
  <div class="flex flex-wrap items-center justify-between gap-3 theme-text">
    <span>{filtered.length} {$adkT("entries")}</span>
    <div class="flex gap-2">
      <button
        type="button"
        class="min-h-[44px] rounded-lg border px-4"
        disabled={page === 0}
        on:click={() => page--}>{$adkT("Prev")}</button
      ><span class="p-3">{page + 1}</span><button
        type="button"
        class="min-h-[44px] rounded-lg border px-4"
        disabled={(page + 1) * 25 >= filtered.length}
        on:click={() => page++}>{$adkT("Next")}</button
      >
    </div>
  </div>
</section>
