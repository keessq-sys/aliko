<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();

  import MessageDesk from "$lib/components/dashboard/MessageDesk.svelte";
</script>

<svelte:head><title>{$adkT("Conversations | Aliko Diamond Key")}</title></svelte:head>
<main class="container mx-auto pt-28 pb-12 px-4"><MessageDesk /></main>
