<script lang="ts">
  import { api } from "$lib/convex/_generated/api";
  import { useQuery, runMutation } from "$lib/convex/queries";
  export let selected: any[] = [];
  let cursor: string | null = null;
  $: assets = useQuery(api.storage.myAssets, {
    paginationOpts: { numItems: 20, cursor },
  });
  let error = "",
    busy = false;
  async function upload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    busy = true;
    error = "";
    try {
      const args = {
        purpose: "SERVICE_ATTACHMENT" as const,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
      };
      const url = await runMutation(api.storage.generateUploadUrl, args);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error("Upload failed");
      const { storageId } = await response.json();
      await runMutation(api.storage.registerUpload, { ...args, storageId });
      cursor = null;
    } catch (e) {
      error = e instanceof Error ? e.message : "Upload failed";
    } finally {
      busy = false;
    }
  }
  function select(id: any, checked: boolean) {
    selected = checked ? [...selected, id] : selected.filter((x) => x !== id);
  }
</script>

<fieldset class="theme-surface rounded-xl border p-3">
  <legend>Attachments</legend>
  <p class="text-sm">
    Upload a PDF, JPG or PNG. Files become selectable after the security scan
    passes.
  </p>
  <label class="block my-3"
    >Upload a file<input
      type="file"
      accept="application/pdf,image/jpeg,image/png"
      disabled={busy}
      on:change={upload}
      class="block w-full mt-2"
    /></label
  >
  {#if error}<p role="alert">{error}</p>{/if}
  {#each $assets?.page ?? [] as asset}<label class="flex gap-2 py-2"
      ><input
        type="checkbox"
        checked={selected.includes(asset._id)}
        disabled={asset.status !== "ACTIVE" ||
          (!selected.includes(asset._id) && selected.length >= 10)}
        on:change={(e) => select(asset._id, e.currentTarget.checked)}
      /><span>{asset.fileName} — {asset.status.replaceAll("_", " ")}</span
      ></label
    >{/each}
  <div class="flex gap-3">
    <button
      type="button"
      class="min-h-[44px] px-3 border rounded"
      disabled={!cursor}
      on:click={() => (cursor = null)}>Latest files</button
    ><button
      type="button"
      class="min-h-[44px] px-3 border rounded"
      disabled={!$assets || $assets.isDone}
      on:click={() => (cursor = $assets?.continueCursor ?? null)}
      >Older files</button
    >
  </div>
</fieldset>
