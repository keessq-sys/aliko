<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  import { prepareUploadFile } from "$lib/utils/prepareUploadFile";
  import { runAction, runMutation } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { getConvexClient } from "convex-svelte";
  import { synchronizeSession } from "$lib/convex/session";
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
      const file = await prepareUploadFile(selected);
      await synchronizeSession(getConvexClient());
      const sha256 = Array.from(
        new Uint8Array(
          await crypto.subtle.digest("SHA-256", await file.arrayBuffer()),
        ),
      )
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const metadata = {
        purpose: "AVATAR_IMAGE" as const,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        sha256,
      };
      const { url, intentId } = await runMutation(
        api.storage.generateUploadUrl,
        metadata,
      );
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error("Photo upload failed. Please retry.");
      const { storageId } = await response.json();
      await runAction(api.storage.registerUpload, {
        ...metadata,
        intentId,
        storageId,
      });
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
