<script lang="ts">
  import { page } from "$app/stores";
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();
  import {
    nigeriaLgas,
    NIGERIAN_STATES,
  } from "../../../../convex/lib/nigeriaLocations";

  import { api } from "$lib/convex/_generated/api";
  import { runMutation, useQuery } from "$lib/convex/queries";
  import { uploadMedia } from "$lib/media/upload";
  import FileUpload from "$lib/components/ui/FileUpload.svelte";
  import { ImagePlus, Loader2 } from "lucide-svelte";

  export let mode: "property" | "service" = "property";
  export let title = "Upload gallery images";
  const properties =
    mode === "property"
      ? useQuery(api.properties.getManageableProperties, {})
      : null;
  const services =
    mode === "service"
      ? useQuery(api.services.listServices, { activeOnly: false })
      : null;
  const profile = useQuery(api.users.getMyProfile, {});
  let reviewReference = "";
  async function review(approved: boolean) {
    error = "";
    try {
      await runMutation(api.properties.reviewProperty, {
        propertyId: selectedId as any,
        approve: approved,
        reference: reviewReference,
      });
      success = approved
        ? "Listing approved for publication."
        : "Listing rejected.";
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "Review failed";
    }
  }
  let selectedId = "";
  let openedListing = "";
  let files: File[] = [];
  let uploading = false;
  let error = "";
  let success = "";
  let editingId = "";
  let creating = false;
  let showCreate = mode === "property";
  let draft = {
    title: "",
    location: "",
    state: "",
    lga: "",
    price: 0,
    type: "RESIDENTIAL",
    description: "",
    sizeSqm: 0,
    bedrooms: 0,
    bathrooms: 0,
  };
  $: rows = mode === "property" ? ($properties ?? []) : ($services ?? []);
  function editSelected() {
    if (!selectedRow) return;
    editingId = selectedId;
    draft = {
      title: selectedRow.title,
      type: selectedRow.type,
      description: selectedRow.description,
      price: selectedRow.price,
      location: selectedRow.location,
      state: selectedRow.state,
      lga: selectedRow.lga ?? "",
      sizeSqm: selectedRow.sizeSqm ?? 0,
      bedrooms: selectedRow.bedrooms ?? 0,
      bathrooms: selectedRow.bathrooms ?? 0,
    };
    showCreate = true;
    document
      .getElementById("listing-editor")
      ?.scrollIntoView({ block: "start" });
  }
  $: selectedRow = rows.find((row) => row._id === selectedId);
  $: requestedListing = $page.url.searchParams.get("listing");
  $: if (!requestedListing) openedListing = "";
  $: if (
    mode === "property" &&
    requestedListing &&
    requestedListing !== openedListing &&
    rows.some((row) => row._id === requestedListing)
  ) {
    selectedId = requestedListing;
    openedListing = requestedListing;
  }
  async function submitListing() {
    error = "";
    success = "";
    uploading = true;
    try {
      await runMutation(api.properties.submitForReview, {
        propertyId: selectedId as any,
      });
      success =
        "Submitted to the administrator for approval. This listing stays private until approved.";
    } catch (cause) {
      error =
        cause instanceof Error ? cause.message : "Could not submit listing";
    } finally {
      uploading = false;
    }
  }
  $: existingImages =
    rows.find((row) => row._id === selectedId)?.images.length ?? 0;

  async function createListing() {
    error = "";
    success = "";
    if (
      !draft.title.trim() ||
      !draft.location.trim() ||
      !draft.state.trim() ||
      !draft.description.trim() ||
      draft.price <= 0
    ) {
      error = "Complete the title, location, state, description and price.";
      return;
    }
    creating = true;
    try {
      const slug = `${draft.title}-${crypto.randomUUID().slice(0, 8)}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      if (editingId) {
        await runMutation(api.properties.editMyListing, {
          propertyId: editingId as any,
          ...draft,
          type: draft.type as "LAND",
        });
        selectedId = editingId;
        editingId = "";
      } else
        selectedId = (await runMutation(api.properties.createProperty, {
          ...draft,
          slug,
          type: draft.type as "RESIDENTIAL",
          amenities: [],
          images: [],
        } as any)) as string;
      success =
        "Draft saved. Add 1–7 images below and submit it for administrator approval.";
      showCreate = false;
      draft = {
        title: "",
        location: "",
        state: "",
        lga: "",
        price: 0,
        type: "RESIDENTIAL",
        description: "",
        sizeSqm: 0,
        bedrooms: 0,
        bathrooms: 0,
      };
    } catch (cause) {
      error =
        cause instanceof Error
          ? cause.message
          : "Could not create the listing.";
    } finally {
      creating = false;
    }
  }

  async function upload() {
    error = "";
    success = "";
    if (!selectedId) return (error = `Choose a ${mode} first.`);
    if (files.length === 0) return (error = "Choose at least one image.");
    if (mode === "property" && existingImages + files.length > 7)
      return (error =
        "Each listing can contain between 1 and 7 images. Choose fewer files.");
    uploading = true;
    try {
      const storageIds: string[] = [];
      const urls: string[] = [];
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        form.append("collection", mode);
        const value = await uploadMedia(form);
        urls.push(value.url);
      }
      if (mode === "property") {
        await runMutation(api.properties.addPropertyMedia, {
          propertyId: selectedId,
          storageIds,
          urls,
        } as any);
      } else {
        await runMutation(api.services.addServiceMedia, {
          id: selectedId,
          storageIds,
          urls,
        } as any);
      }
      const uploadedCount = files.length;
      files = [];
      if (mode === "property" && $profile?.role !== "ADMIN") {
        await runMutation(api.properties.submitForReview, {
          propertyId: selectedId as any,
        });
        success =
          "Submitted to the administrator for approval. This listing stays private until approved.";
      } else
        success = `${uploadedCount} images saved. Review the listing before publication.`;
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "Upload failed.";
    } finally {
      uploading = false;
    }
  }
</script>

<section
  id="listing-editor"
  class="mb-6 rounded-2xl border border-white/10 bg-[#0A1628] p-5 theme-surface"
>
  <h2 class="mb-1 flex items-center gap-2 font-bold text-white theme-text">
    <ImagePlus size={18} class="text-emerald-400" />
    {$adkT(title)}
  </h2>
  <p class="mb-4 text-xs text-stone-500">
    {$adkT(
      mode === "property"
        ? "Add listing details and 1–7 images. The administrator reviews your submission before it appears publicly."
        : "JPG, PNG, WebP or AVIF. Images are published to the selected live gallery.",
    )}
  </p>
  {#if mode === "property"}
    <button
      type="button"
      class="mb-4 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
      on:click={() => (showCreate = !showCreate)}
    >
      {$adkT(
        showCreate ? "Hide listing details" : "+ Add property or land for sale",
      )}
    </button>
    {#if showCreate}
      <div
        class="mb-5 grid gap-3 rounded-xl border border-white/10 bg-black/20 p-4 md:grid-cols-2 theme-panel"
      >
        <label class="theme-text text-sm"
          >{$adkT("Listing title")}<input
            dir="auto"
            bind:value={draft.title}
            aria-label={$adkT("Property title")}
            placeholder={$adkT("Property title")}
            class="block w-full min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white theme-input"
          /></label
        >
        <select
          bind:value={draft.type}
          aria-label={$adkT("Property type")}
          class="block w-full min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white theme-input"
        >
          <option value="RESIDENTIAL">{$adkT("Residential")}</option><option
            value="APARTMENT">{$adkT("Apartment")}</option
          ><option value="DUPLEX">{$adkT("Duplex")}</option><option
            value="PENTHOUSE">{$adkT("Penthouse")}</option
          ><option value="COMMERCIAL">{$adkT("Commercial")}</option><option
            value="LAND">{$adkT("Land")}</option
          >
        </select>
        <label class="theme-text text-sm"
          >{$adkT("Neighbourhood / address (e.g. Gwarinpa)")}<input
            dir="auto"
            bind:value={draft.location}
            aria-label={$adkT("Location")}
            placeholder={$adkT("Location or neighbourhood")}
            class="block w-full min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white theme-input"
          /></label
        >
        <select
          on:change={() => (draft.lga = "")}
          bind:value={draft.state}
          aria-label={$adkT("State")}
          class="theme-input min-h-[44px] border rounded-lg p-3"
          ><option value="">{$adkT("Select state")}</option
          >{#each NIGERIAN_STATES as state}<option value={state}
              >{$adkT(state)}</option
            >{/each}</select
        ><label class="theme-text"
          >{$adkT("Local Government Area")}<select
            bind:value={draft.lga}
            disabled={!draft.state}
            class="theme-input w-full min-h-[44px] border rounded-lg p-3"
            ><option value="">{$adkT("Select LGA")}</option
            >{#each nigeriaLgas(draft.state) as lga}<option value={lga}
                >{$adkT(lga)}</option
              >{/each}</select
          ></label
        >
        <label class="theme-text text-sm"
          >{$adkT("Price in naira")}<input
            dir="auto"
            bind:value={draft.price}
            aria-label={$adkT("Price in naira")}
            type="number"
            min="1"
            placeholder={$adkT("Price in naira")}
            class="block w-full min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white theme-input"
          /></label
        >
        <label class="theme-text text-sm"
          >{$adkT("Area (square metres)")}<input
            dir="ltr"
            type="number"
            min="0"
            bind:value={draft.sizeSqm}
            class="theme-input w-full min-h-[44px] rounded-lg border p-3"
          /></label
        >
        {#if draft.type !== "LAND"}
          <label class="theme-text text-sm"
            >{$adkT("Bedrooms")}<input
              dir="ltr"
              type="number"
              min="0"
              bind:value={draft.bedrooms}
              class="theme-input w-full min-h-[44px] rounded-lg border p-3"
            /></label
          >
          <label class="theme-text text-sm"
            >{$adkT("Bathrooms")}<input
              dir="ltr"
              type="number"
              min="0"
              bind:value={draft.bathrooms}
              class="theme-input w-full min-h-[44px] rounded-lg border p-3"
            /></label
          >
        {/if}
        <textarea
          dir="auto"
          bind:value={draft.description}
          aria-label={$adkT("Description")}
          placeholder={$adkT("Property description")}
          rows="3"
          class="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white theme-input"
        ></textarea>
        <button
          type="button"
          on:click={createListing}
          disabled={creating}
          class="min-h-[44px] rounded-lg bg-amber-500 px-4 text-sm font-bold text-black disabled:opacity-50 md:col-span-2"
          >{$adkT(creating ? "Saving…" : "Save listing details")}</button
        >
      </div>
    {/if}
  {/if}
  <div class="grid gap-4 lg:grid-cols-[minmax(220px,0.7fr)_1.3fr]">
    <label class="block"
      ><span class="mb-1 block text-xs text-stone-400"
        >{$adkT("Destination")}</span
      >
      <select
        bind:value={selectedId}
        class="min-h-[44px] w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white theme-input"
      >
        <option value="">{$adkT("Select")} {$adkT(mode)}</option>
        {#each rows as row}<option value={row._id}
            >{$adkT(mode === "property" ? row.title : row.name)}</option
          >{/each}
      </select>
    </label>
    <FileUpload
      accept="image/jpeg,image/png,image/webp,image/avif"
      multiple
      maxSizeMB={15}
      maxFiles={mode === "property" ? Math.max(0, 7 - existingImages) : 30}
      label={$adkT("Choose gallery images")}
      on:files={(event) => (files = event.detail.files)}
    />
  </div>
  {#if selectedRow && mode === "property"}
    <div
      class="mt-4 theme-panel rounded-xl border p-4 space-y-3"
      aria-live="polite"
    >
      <p class="theme-text font-semibold">
        {$adkT("Review status")}: {$adkT(
          selectedRow.verificationStatus ?? "DRAFT",
        )}
      </p>
      {#if selectedRow.verificationStatus === "REJECTED"}<p class="theme-text">
          {selectedRow.verificationReference}
        </p>{/if}
      <button
        type="button"
        on:click={editSelected}
        class="min-h-[44px] rounded-lg border px-4"
        >{$adkT("Edit listing details")}</button
      >
      <div class="flex flex-wrap gap-2">
        {#each selectedRow.images as image}<img
            src={image}
            alt={$adkT("Gallery item")}
            class="h-20 w-24 rounded-lg object-cover"
          />{/each}
      </div>
      {#if $profile?.role !== "ADMIN"}<button
          type="button"
          on:click={submitListing}
          disabled={uploading ||
            !existingImages ||
            selectedRow.verificationStatus === "PENDING" ||
            selectedRow.verificationStatus === "VERIFIED"}
          class="btn-primary min-h-[44px] rounded-lg px-4"
          >{$adkT("Submit listing for approval")}</button
        >{/if}
    </div>
  {/if}
  {#if error}<p role="alert" class="mt-3 text-sm text-rose-400">
      {$adkT(error)}
    </p>{/if}
  {#if success}<p class="mt-3 text-sm text-emerald-400">
      {$adkT(success)}
    </p>{/if}
  {#if mode === "property" && $profile?.role === "ADMIN" && selectedId}
    <div class="mt-4 flex flex-wrap items-center gap-3">
      <label class="text-sm"
        >{$adkT("Verification evidence reference")}<input
          dir="auto"
          bind:value={reviewReference}
          class="theme-input block min-h-[44px] rounded-lg border px-3"
          minlength="8"
        /></label
      ><button
        type="button"
        on:click={() => review(true)}
        class="min-h-[44px] rounded-lg bg-emerald-700 px-4 text-white"
        >{$adkT("Approve publication")}</button
      ><button
        type="button"
        on:click={() => review(false)}
        class="min-h-[44px] rounded-lg border px-4"
        >{$adkT("Reject listing")}</button
      >
    </div>
  {/if}
  <button
    type="button"
    on:click={upload}
    disabled={uploading || files.length === 0 || !selectedId}
    class="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
  >
    {#if uploading}<Loader2 size={15} class="animate-spin" />{/if}
    {$adkT(
      mode === "property"
        ? $profile?.role === "ADMIN"
          ? "Save gallery images"
          : "Upload images and submit for approval"
        : "Publish service images",
    )}
    {files.length || ""}
  </button>
</section>
