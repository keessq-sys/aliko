<script lang="ts">
  import { page } from "$app/stores";
  import { getTranslation } from "$lib/i18n";
  import { formatNaira } from "$lib/utils/format";
  const adkT = getTranslation();
  export let properties: any[] = [];
  let search = "",
    status = "";
  $: visible = properties.filter(
    (p) =>
      (!status || p.status === status) &&
      (!search ||
        `${p.title} ${p.location}`
          .toLowerCase()
          .includes(search.toLowerCase())),
  );
</script>

<section class="theme-surface rounded-xl border p-4 space-y-4">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <h3 class="theme-text text-lg font-semibold">
      {$adkT("Managed Properties")}
    </h3>
    <a href="#listing-editor" class="btn-primary min-h-[44px] px-4 py-3"
      >{$adkT("Add property or land")}</a
    >
  </div>
  <div class="flex flex-wrap gap-3">
    <label class="theme-text text-sm"
      >{$adkT("Search")}<input
        dir="auto"
        bind:value={search}
        class="theme-input block min-h-[44px] rounded-lg border p-3"
      /></label
    ><label class="theme-text text-sm"
      >{$adkT("Status")}<select
        bind:value={status}
        class="theme-input block min-h-[44px] rounded-lg border p-3"
        ><option value="">{$adkT("All")}</option
        >{#each ["AVAILABLE", "RESERVED", "SOLD"] as value}<option {value}
            >{$adkT(value)}</option
          >{/each}</select
      ></label
    >
  </div>
  <div class="overflow-x-auto">
    <table class="w-full text-start text-sm theme-text">
      <thead
        ><tr
          >{#each ["Property", "Location", "Status", "Price", "Actions"] as text}<th
              class="p-3 text-start">{$adkT(text)}</th
            >{/each}</tr
        ></thead
      ><tbody
        >{#each visible as property}<tr class="border-t"
            ><td class="p-3">{property.title}</td><td class="p-3"
              >{property.location}</td
            ><td class="p-3">{$adkT(property.status)}</td><td class="p-3"
              >{formatNaira(property.price)}</td
            ><td class="p-3"
              ><a
                class="inline-flex min-h-[44px] items-center rounded-lg border px-3"
                href={`?listing=${encodeURIComponent(property.id)}${$page.url.hash || ($page.url.pathname.includes("manager") ? "#properties" : "#listings")}`}
                >{$adkT("Manage listing")}</a
              ></td
            ></tr
          >{/each}</tbody
      >
    </table>
  </div>
  {#if !visible.length}<p class="theme-field-muted py-6 text-center">
      {$adkT("No listings match your filters.")}
    </p>{/if}
</section>
