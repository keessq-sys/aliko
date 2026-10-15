<script lang="ts">
  import { getI18n } from "$lib/i18n";
  const { locale: adkLocale } = getI18n();

  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();

  import { page } from "$app/stores";
  import type { Id } from "../../../../convex/_generated/dataModel";
  export let adminMode = false;
  let recipientId = $page.url.searchParams.get("recipient") ?? "";
  const recipients = useQuery(adminMode ? api.users.listUsers : null, {
    limit: 500,
  });

  import { api } from "$lib/convex/_generated/api";
  import { useQuery, runMutation } from "$lib/convex/queries";
  import ScannedAttachments from "./ScannedAttachments.svelte";
  let cursor: string | null = null,
    messageCursor: string | null = null,
    selected: any = null,
    subject = "",
    body = "",
    reply = "",
    error = "",
    busy = false,
    attachments: any[] = [];
  $: threads = useQuery(
    api.messaging.list,
    {
      paginationOpts: { cursor, numItems: 20 },
    },
    () =>
      (error =
        "Conversation data could not be loaded. Please try again later."),
  );
  $: messages = useQuery(
    selected ? api.messaging.messages : null,
    {
      conversationId: selected?._id,
      paginationOpts: { cursor: messageCursor, numItems: 30 },
    } as any,
    () =>
      (error =
        "Conversation data could not be loaded. Please try again later."),
  );
  $: currentThread = useQuery(
    selected ? api.messaging.thread : null,
    {
      conversationId: selected?._id,
    } as any,
    () =>
      (error =
        "Conversation data could not be loaded. Please try again later."),
  );
  $: if (
    $currentThread &&
    selected &&
    $currentThread.status !== selected.status
  )
    selected = $currentThread;
  async function create() {
    busy = true;
    error = "";
    try {
      if (adminMode && !recipientId) throw new Error("Choose an account");
      const id = await runMutation(api.messaging.create, {
        subject,
        body,
        recipientId:
          adminMode && recipientId ? (recipientId as Id<"users">) : undefined,
      });
      selected = { _id: id, subject, status: "OPEN" };
      messageCursor = null;
      subject = "";
      body = "";
      cursor = null;
    } catch (e) {
      error = e instanceof Error ? e.message : "Could not create conversation";
    } finally {
      busy = false;
    }
  }
  let reference = crypto.randomUUID();
  async function send() {
    busy = true;
    error = "";
    try {
      await runMutation(api.messaging.reply, {
        conversationId: selected._id,
        body: reply,
        attachmentIds: attachments,
        clientReference: reference,
      });
      reply = "";
      attachments = [];
      reference = crypto.randomUUID();
      messageCursor = null;
    } catch (e) {
      error = e instanceof Error ? e.message : "Could not send message";
    } finally {
      busy = false;
    }
  }
  async function status(value: "OPEN" | "CLOSED") {
    try {
      await runMutation(api.messaging.setStatus, {
        conversationId: selected._id,
        status: value,
      });
      selected = { ...selected, status: value };
    } catch (e) {
      error = e instanceof Error ? e.message : "Could not update";
    }
  }
</script>

<section class="message-desk workspace-panel p-5 md:p-7 space-y-6">
  <div class="workspace-eyebrow">{$adkT("Private workspace")}</div>
  <h2 class="text-2xl font-semibold">{$adkT("Conversations")}</h2>
  <p>
    {$adkT(
      "Messages are private to your account and the support administrators. Replies update in real time.",
    )}
  </p>
  {#if error}<p role="alert" class="text-rose-600">{$adkT(error)}</p>{/if}
  <details open={!selected}>
    <summary class="workspace-action">✉️ {$adkT("New conversation")}</summary>
    <form on:submit|preventDefault={create} class="grid gap-3">
      {#if adminMode}<label
          >{$adkT("Recipient")}<select
            required
            bind:value={recipientId}
            class="theme-input block w-full p-3 border rounded"
          >
            <option value="">{$adkT("Choose an account")}</option>
            {#each $recipients ?? [] as recipient}<option value={recipient._id}
                >{recipient.name} — {recipient.email}</option
              >{/each}
          </select></label
        >{/if}
      <label
        >{$adkT("Subject")}<input
          dir="auto"
          required
          minlength="3"
          maxlength="180"
          bind:value={subject}
          class="theme-input block w-full p-3 border rounded"
        /></label
      ><label
        >{$adkT("Message")}<textarea
          dir="auto"
          required
          maxlength="10000"
          bind:value={body}
          class="theme-input block w-full p-3 border rounded"
        ></textarea></label
      ><button
        disabled={busy}
        class="min-h-[44px] px-4 py-2 rounded bg-emerald-700 text-white"
        >{$adkT("Start conversation")}</button
      >
    </form>
  </details>
  <div class="grid gap-6 lg:grid-cols-[minmax(220px,.7fr)_minmax(0,1fr)]">
    <div class="space-y-2">
      {#if $threads === undefined}<p>
          {$adkT("Loading conversations…")}
        </p>{:else if !$threads.page.length}<p>
          {$adkT("No conversations yet.")}
        </p>{/if}
      {#each $threads?.page ?? [] as thread}<button
          class="theme-surface block w-full text-left p-3 border rounded min-h-[44px]"
          on:click={() => {
            selected = thread;
            messageCursor = null;
            reply = "";
            reference = crypto.randomUUID();
          }}
          >{thread.subject}<span class="block text-sm"
            >{$adkT(thread.status)} · {new Date(
              thread.updatedAt,
            ).toLocaleString($adkLocale === "ar" ? "ar-NG" : "en-NG")}</span
          ></button
        >{/each}
      <button
        class="min-h-[44px] px-3 border rounded"
        disabled={!cursor}
        on:click={() => (cursor = null)}>{$adkT("Latest")}</button
      ><button
        class="min-h-[44px] px-3 border rounded"
        disabled={!$threads || $threads.isDone}
        on:click={() => (cursor = $threads?.continueCursor ?? null)}
        >{$adkT("Older conversations")}</button
      >
    </div>
    {#if selected}<div class="space-y-3">
        <h3 class="text-lg font-semibold">{selected.subject}</h3>
        <button
          class="min-h-[44px] px-3 border rounded"
          on:click={() =>
            status(selected.status === "OPEN" ? "CLOSED" : "OPEN")}
          >{selected.status === "OPEN"
            ? "Close conversation"
            : "Reopen conversation"}</button
        >
        {#each [...($messages?.page ?? [])].reverse() as message}<article
            class="p-3 border rounded"
          >
            <p class="text-xs">
              {$adkT(message.authorRole)} · {new Date(
                message.createdAt,
              ).toLocaleString($adkLocale === "ar" ? "ar-NG" : "en-NG")}
            </p>
            <p dir="auto" class="whitespace-pre-wrap break-words mt-2">
              {message.body}
            </p>
            {#each message.attachments as file}{#if file?.url}<a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="block underline">{file.name}</a
                >{/if}{/each}
          </article>{/each}
        <button
          class="min-h-[44px] border rounded px-3"
          disabled={!$messages || $messages.isDone}
          on:click={() => (messageCursor = $messages?.continueCursor ?? null)}
          >{$adkT("Earlier messages")}</button
        >
        {#if selected.status === "OPEN"}<form
            on:submit|preventDefault={send}
            class="space-y-3"
          >
            <label
              >{$adkT("Reply")}<textarea
                dir="auto"
                required
                maxlength="10000"
                bind:value={reply}
                class="theme-input block w-full p-3 border rounded"
              ></textarea></label
            ><ScannedAttachments bind:selected={attachments} /><button
              disabled={busy}
              class="min-h-[44px] rounded px-4 bg-emerald-700 text-white"
              >{$adkT("Send reply")}</button
            >
          </form>{/if}
      </div>{/if}
  </div>
</section>

<style>
  .message-desk {
    color: var(--text-main);
  }
  .message-desk form {
    padding-top: 18px;
  }
  .message-desk summary {
    cursor: pointer;
    display: inline-flex;
  }
  .message-desk label {
    display: block;
    font-size: 14px;
    font-weight: 600;
  }
  .message-desk :is(input, textarea, select) {
    margin-top: 8px;
    border-color: var(--field-border);
  }
  .message-desk textarea {
    min-height: 120px;
  }
  .message-desk article {
    background: var(--workspace-tint);
    border-color: var(--workspace-line);
    padding: 18px;
    border-radius: 12px;
  }
  .message-desk button {
    border-radius: 10px;
  }
  .message-desk p {
    line-height: 1.7;
  }
  .message-desk :is(a, button):focus-visible {
    outline: 3px solid var(--field-focus);
    outline-offset: 2px;
  }
</style>
