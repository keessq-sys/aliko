<script lang="ts">
  import { getI18n, getTranslation } from "$lib/i18n";
  import { useQuery, runMutation } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { Loader2, ExternalLink, CheckCircle } from "lucide-svelte";
  import { formatRelative } from "$lib/utils/format";
  const { locale: adkLocale } = getI18n();
  const adkT = getTranslation();
  const queue = useQuery(api.whatsapp.getHumanReviewQueue, {});
  let actingId: string | null = null;
  let actionError = "";
  async function resolve(id: any) {
    if (actingId) return;
    actingId = String(id);
    actionError = "";
    try {
      await runMutation(api.whatsapp.resolveSession, { sessionId: id });
    } catch {
      actionError = "This conversation could not be resolved. Please retry.";
    } finally {
      actingId = null;
    }
  }
</script>

<svelte:head><title>{$adkT("WhatsApp Queue — ADK Admin")}</title></svelte:head>
<div class="p-8">
  <div class="mb-8 flex flex-wrap items-start justify-between gap-4">
    <div>
      <div class="workspace-eyebrow">{$adkT("Customer support")}</div>
      <h1>{$adkT("WhatsApp Review Queue")}</h1>
      <p class="workspace-description mt-2">
        {$adkT("Conversations the bot escalated to a human agent.")}
      </p>
    </div>
    <div class="workspace-action">
      <span aria-hidden="true">💬</span><strong>{$queue?.length ?? "—"}</strong>
      {$adkT("awaiting review")}
    </div>
  </div>
  {#if actionError}<p role="alert" class="theme-form-error mb-4">
      {$adkT(actionError)}
    </p>{/if}
  <section class="workspace-panel" aria-label={$adkT("Support conversations")}>
    <div class="workspace-panel-heading">
      <div>
        <h2>{$adkT("Support conversations")}</h2>
        <p class="workspace-description">
          {$adkT(
            "Open a chat to respond, then resolve it when support is complete.",
          )}
        </p>
      </div>
      <span class="workspace-nav-icon" aria-hidden="true">📥</span>
    </div>
    {#if $queue === undefined}<div class="workspace-empty" role="status">
        <Loader2 size={28} class="animate-spin" />
        <p>{$adkT("Loading conversations")}</p>
      </div>
    {:else if $queue.length === 0}<div class="workspace-empty">
        <div class="workspace-empty-icon" aria-hidden="true">✅</div>
        <h2>{$adkT("Queue clear")}</h2>
        <p>{$adkT("No sessions awaiting human review.")}</p>
        <a class="workspace-action" href="/admin/messages"
          >{$adkT("Company conversations")}</a
        >
      </div>
    {:else}<div class="divide-y" style="border-color: var(--workspace-line)">
        {#each $queue as session (session._id)}<article
            class="flex flex-wrap items-center gap-5 p-6"
          >
            <span
              class="workspace-empty-icon"
              style="width:48px;height:48px;font-size:24px"
              aria-hidden="true">💬</span
            >
            <div class="min-w-0 flex-1">
              <h2 class="break-words">{session.phone}</h2>
              <p class="workspace-description">
                {$adkT("State:")}
                {session.state} · {formatRelative(
                  new Date(session.updatedAt),
                  $adkLocale,
                )}
              </p>
            </div>
            <div class="flex flex-wrap gap-3">
              <a
                href="https://wa.me/{session.phone.replace(/[^0-9]/g, '')}"
                target="_blank"
                rel="noopener noreferrer"
                class="workspace-action"
                ><ExternalLink size={16} />{$adkT("Open Chat")}</a
              ><button
                type="button"
                class="workspace-action workspace-action-primary"
                disabled={actingId !== null}
                on:click={() => resolve(session._id)}
                >{#if actingId === String(session._id)}<Loader2
                    size={16}
                    class="animate-spin"
                  />{:else}<CheckCircle size={16} />{/if}{$adkT(
                  "Resolve",
                )}</button
              >
            </div>
          </article>{/each}
      </div>{/if}
  </section>
</div>
