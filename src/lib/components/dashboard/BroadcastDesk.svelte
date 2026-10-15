<script lang="ts">
  import { api } from "$lib/convex/_generated/api";
  import { useQuery, runMutation } from "$lib/convex/queries";
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();
  const rows = useQuery(
    api.engagement.broadcasts,
    {},
    () =>
      (error =
        "Broadcast records could not be loaded. Please try again later."),
  );
  let title = "",
    message = "",
    audience = "ALL",
    email = false,
    device = false,
    busy = false,
    error = "",
    notice = "";
  async function draft() {
    busy = true;
    error = "";
    try {
      await runMutation(api.engagement.draftBroadcast, {
        title,
        message,
        audience,
        email,
        device,
      });
      title = "";
      message = "";
      notice = "Draft saved. Review the content and audience before approval.";
    } catch {
      error = "Broadcast draft could not be saved.";
    } finally {
      busy = false;
    }
  }
  async function action(row: any, kind: string) {
    busy = true;
    error = "";
    try {
      if (kind === "send")
        await runMutation(api.engagement.sendBroadcast, { id: row._id });
      else
        await runMutation(api.engagement.reviewBroadcast, {
          id: row._id,
          approve: kind === "approve",
        });
      notice =
        kind === "send"
          ? "Approved broadcast queued. Check recipient progress and channel logs."
          : "Review decision recorded.";
    } catch {
      error = "Broadcast action failed. Refresh its status and retry.";
    } finally {
      busy = false;
    }
  }
</script>

<section class="workspace-panel mb-8">
  <div class="workspace-panel-heading">
    <div>
      <h2>{$adkT("Reviewed broadcasts")}</h2>
      <p class="workspace-description">
        {$adkT(
          "Draft → review → approve → send. External announcements respect recipient preferences.",
        )}
      </p>
    </div>
    <span aria-hidden="true">📣</span>
  </div>
  <div class="p-5 space-y-5">
    {#if error}<p role="alert" class="theme-form-error">
        {$adkT(error)}
      </p>{/if}{#if notice}<p role="status" class="theme-form-success">
        {$adkT(notice)}
      </p>{/if}
    <form on:submit|preventDefault={draft} class="grid gap-4">
      <label
        >{$adkT("Title")}<input
          class="theme-input w-full rounded-lg p-3"
          required
          minlength="3"
          maxlength="160"
          bind:value={title}
        /></label
      ><label
        >{$adkT("Message")}<textarea
          class="theme-input w-full rounded-lg p-3"
          rows="3"
          required
          maxlength="3000"
          bind:value={message}
        ></textarea></label
      ><label
        >{$adkT("Audience")}<select
          class="theme-input rounded-lg p-3 w-full"
          bind:value={audience}
          >{#each ["ALL", "CLIENT", "AGENT", "ESTATE_MANAGER", "ADMIN", "TENANT", "DIASPORA_CLIENT"] as role}<option
              value={role}>{role}</option
            >{/each}</select
        ></label
      >
      <div class="flex flex-wrap gap-5">
        <span>{$adkT("Private in-app inbox: included")}</span><label
          class="flex gap-2"
          ><input type="checkbox" bind:checked={email} />{$adkT("Email")}</label
        ><label class="flex gap-2"
          ><input type="checkbox" bind:checked={device} />{$adkT(
            "Device alerts",
          )}</label
        >
      </div>
      <button
        class="workspace-action workspace-action-primary justify-self-start"
        disabled={busy}>{$adkT("Save draft")}</button
      >
    </form>
    {#if $rows === undefined}<p role="status">
        {$adkT("Loading broadcasts…")}
      </p>{:else if !$rows.length}<p class="workspace-description">
        {$adkT(
          "No broadcasts yet. Draft an announcement to review it before sending.",
        )}
      </p>{:else}<div class="space-y-4">
        {#each $rows as row}<article
            class="rounded-xl border p-4 space-y-3"
            style="border-color:var(--workspace-line)"
          >
            <div class="flex flex-wrap justify-between gap-3">
              <h3>{row.title}</h3>
              <strong>{row.status}</strong>
            </div>
            <p class="whitespace-pre-wrap break-words">{row.message}</p>
            <p class="workspace-description">
              {row.audience} · {row.recipients}
              {$adkT("in-app recipients")} · {$adkT(
                row.email ? "Email selected" : "Email off",
              )} · {$adkT(row.device ? "Device selected" : "Device off")}
            </p>
            <div class="flex flex-wrap gap-3">
              {#if row.status === "DRAFT"}<button
                  class="workspace-action"
                  disabled={busy}
                  on:click={() => action(row, "cancel")}
                  >{$adkT("Cancel draft")}</button
                ><button
                  class="workspace-action"
                  disabled={busy}
                  on:click={() => action(row, "approve")}
                  >{$adkT("Approve reviewed draft")}</button
                >{:else if row.status === "APPROVED"}<button
                  class="workspace-action workspace-action-primary"
                  disabled={busy}
                  on:click={() => action(row, "send")}
                  >{$adkT("Send approved broadcast")}</button
                >{/if}
            </div>
          </article>{/each}
      </div>{/if}
  </div>
</section>
