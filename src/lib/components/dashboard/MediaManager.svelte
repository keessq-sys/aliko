<script lang="ts">
  import { api } from '$lib/convex/_generated/api';
  import { runMutation, useQuery } from '$lib/convex/queries';
  import FileUpload from '$lib/components/ui/FileUpload.svelte';
  import { ImagePlus, Loader2 } from 'lucide-svelte';

  export let mode: 'property' | 'service' = 'property';
  export let title = 'Upload gallery images';
  const properties = mode === 'property' ? useQuery(api.properties.getManageableProperties, {}) : null;
  const services = mode === 'service' ? useQuery(api.services.listServices, { activeOnly: false }) : null;
  let selectedId = '';
  let files: File[] = [];
  let uploading = false;
  let error = '';
  let success = '';
  let creating = false;
  let showCreate = false;
  let draft = { title: '', location: '', state: '', price: 0, type: 'RESIDENTIAL', description: '' };
  $: rows = mode === 'property' ? ($properties ?? []) : ($services ?? []);

  async function createListing() {
    error = ''; success = '';
    if (!draft.title.trim() || !draft.location.trim() || !draft.state.trim() || !draft.description.trim() || draft.price <= 0) {
      error = 'Complete the title, location, state, description and price.';
      return;
    }
    creating = true;
    try {
      const slug = `${draft.title}-${crypto.randomUUID().slice(0, 8)}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      selectedId = await runMutation(api.properties.createProperty, {
        ...draft,
        slug,
        type: draft.type as 'RESIDENTIAL',
        amenities: [],
        images: [],
      } as any) as string;
      success = 'Listing created. Select images below to publish its gallery.';
      showCreate = false;
      draft = { title: '', location: '', state: '', price: 0, type: 'RESIDENTIAL', description: '' };
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Could not create the listing.';
    } finally { creating = false; }
  }

  async function uploadToConvex(file: File): Promise<string> {
    const uploadUrl = await runMutation(api.storage.generateUploadUrl, { purpose: 'PROPERTY_IMAGE', fileName: file.name, mimeType: file.type, size: file.size });
    const response = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
    if (!response.ok) throw new Error(`Could not upload ${file.name}`);
    const result = await response.json() as { storageId: string };
    await runMutation(api.storage.registerUpload, { storageId: result.storageId, purpose: 'PROPERTY_IMAGE', fileName: file.name, mimeType: file.type, size: file.size } as any);
    return result.storageId;
  }

  async function upload() {
    error = ''; success = '';
    if (!selectedId) return error = `Choose a ${mode} first.`;
    if (files.length === 0) return error = 'Choose at least one image.';
    uploading = true;
    try {
      const storageIds: string[] = [];
      const urls: string[] = [];
      for (const file of files) {
        const form = new FormData(); form.append('file', file); form.append('collection', mode);
        const r2 = await fetch('/api/media/upload', { method: 'POST', body: form });
        if (r2.ok) {
          const value = await r2.json() as { url: string }; urls.push(value.url);
        } else {
          storageIds.push(await uploadToConvex(file));
        }
      }
      if (mode === 'property') {
        await runMutation(api.properties.addPropertyMedia, { propertyId: selectedId, storageIds, urls } as any);
      } else {
        await runMutation(api.services.addServiceMedia, { id: selectedId, storageIds, urls } as any);
      }
      success = `${files.length} image${files.length === 1 ? '' : 's'} published successfully.`;
      files = [];
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Upload failed.';
    } finally { uploading = false; }
  }
</script>

<section class="mb-6 rounded-2xl border border-white/10 bg-[#0A1628] p-5 theme-surface">
  <h2 class="mb-1 flex items-center gap-2 font-bold text-white theme-text"><ImagePlus size={18} class="text-emerald-400" /> {title}</h2>
  <p class="mb-4 text-xs text-stone-500">JPG, PNG, WebP or AVIF. Images are published to the selected live gallery.</p>
  {#if mode === 'property'}
    <button type="button" class="mb-4 text-sm font-semibold text-emerald-400 hover:text-emerald-300" on:click={() => showCreate = !showCreate}>
      {showCreate ? 'Close listing form' : '+ Create a new property listing'}
    </button>
    {#if showCreate}
      <div class="mb-5 grid gap-3 rounded-xl border border-white/10 bg-black/20 p-4 md:grid-cols-2 theme-panel">
        <input bind:value={draft.title} aria-label="Property title" placeholder="Property title" class="min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white theme-input" />
        <select bind:value={draft.type} aria-label="Property type" class="min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white theme-input">
          <option value="RESIDENTIAL">Residential</option><option value="APARTMENT">Apartment</option><option value="DUPLEX">Duplex</option><option value="PENTHOUSE">Penthouse</option><option value="COMMERCIAL">Commercial</option><option value="LAND">Land</option>
        </select>
        <input bind:value={draft.location} aria-label="Location" placeholder="Location or neighbourhood" class="min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white theme-input" />
        <input bind:value={draft.state} aria-label="State" placeholder="State" class="min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white theme-input" />
        <input bind:value={draft.price} aria-label="Price in naira" type="number" min="1" placeholder="Price in naira" class="min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white theme-input" />
        <textarea bind:value={draft.description} aria-label="Description" placeholder="Property description" rows="3" class="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white theme-input"></textarea>
        <button type="button" on:click={createListing} disabled={creating} class="min-h-[44px] rounded-lg bg-amber-500 px-4 text-sm font-bold text-black disabled:opacity-50 md:col-span-2">{creating ? 'Creating…' : 'Create listing'}</button>
      </div>
    {/if}
  {/if}
  <div class="grid gap-4 lg:grid-cols-[minmax(220px,0.7fr)_1.3fr]">
    <label class="block"><span class="mb-1 block text-xs text-stone-400">Destination</span>
      <select bind:value={selectedId} class="min-h-[44px] w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white theme-input">
        <option value="">Select {mode}</option>
        {#each rows as row}<option value={row._id}>{mode === 'property' ? row.title : row.name}</option>{/each}
      </select>
    </label>
    <FileUpload accept="image/jpeg,image/png,image/webp,image/avif" multiple maxSizeMB={15} label="Choose gallery images" on:files={(event) => files = event.detail.files} />
  </div>
  {#if error}<p class="mt-3 text-sm text-rose-400">{error}</p>{/if}
  {#if success}<p class="mt-3 text-sm text-emerald-400">{success}</p>{/if}
  <button type="button" on:click={upload} disabled={uploading || files.length === 0 || !selectedId} class="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
    {#if uploading}<Loader2 size={15} class="animate-spin" />{/if} Publish {files.length || ''} image{files.length === 1 ? '' : 's'}
  </button>
</section>
