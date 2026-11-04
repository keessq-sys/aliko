<script lang="ts">
  import { updatePortrait } from "$lib/media/portrait";
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();
  export let avatarUrl: string | undefined = undefined;
  let busy = false,
    error = "",
    saved = false;
  async function update(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const selected = input.files?.[0];
    if (!selected) return;
    busy = true;
    error = "";
    saved = false;
    try {
      if (
        !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
          selected.type,
        ) ||
        selected.size > 2_000_000
      )
        throw new Error("Choose a JPG, PNG, WebP or AVIF image up to 2 MB.");
      avatarUrl = await updatePortrait(selected);
      saved = true;
    } catch (cause) {
      error =
        cause instanceof Error
          ? cause.message
          : "Could not update profile photo";
    } finally {
      busy = false;
      input.value = "";
    }
  }
</script>

<div class="rounded-xl border p-4 theme-panel space-y-3">
  <div class="flex items-center gap-4">
    {#if avatarUrl}<img
        src={avatarUrl}
        alt={$adkT("Your profile")}
        class="h-20 w-20 rounded-full object-cover"
      />{/if}
    <label class="theme-text block flex-1 text-sm font-medium">
      {$adkT("Update profile photo")}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        disabled={busy}
        on:change={update}
        class="theme-input mt-2 block w-full min-h-[44px] max-w-full"
      />
    </label>
  </div>
  <p class="text-xs theme-field-muted">
    {$adkT("JPG, PNG, WebP or AVIF · maximum 2 MB")}
  </p>
  {#if busy}<p role="status">{$adkT("Uploading profile photo…")}</p>{/if}
  {#if saved}<p role="status" class="text-emerald-500">
      {$adkT("Profile photo updated.")}
    </p>{/if}
  {#if error}<p role="alert" class="text-rose-500">{$adkT(error)}</p>{/if}
</div>
