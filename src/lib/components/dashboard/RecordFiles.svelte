<script lang="ts">
  import { api } from "$lib/convex/_generated/api";
  import { useQuery } from "$lib/convex/queries";
  export let recordId: any;
  $: links = useQuery(api.management.attachmentLinks, { recordId });
</script>

{#each $links ?? [] as file}{#if file?.url}<a
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      class="block underline py-2">{file.name}</a
    >{/if}{/each}
