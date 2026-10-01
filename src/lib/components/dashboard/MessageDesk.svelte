<script lang="ts">
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
  $: threads = useQuery(api.messaging.list, {
    paginationOpts: { cursor, numItems: 20 },
  });
  $: messages = useQuery(selected ? api.messaging.messages : null, {
    conversationId: selected?._id,
    paginationOpts: { cursor: messageCursor, numItems: 30 },
  } as any);
  $: currentThread = useQuery(selected ? api.messaging.thread : null, {
    conversationId: selected?._id,
  } as any);
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
      const id = await runMutation(api.messaging.create, { subject, body });
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

<section class="theme-surface theme-text rounded-2xl border p-5 space-y-5">
  <h2 class="text-2xl font-semibold">Conversations</h2>
  <p>
    Messages are private to your account and the support administrators. Replies
    update in real time.
  </p>
  {#if error}<p role="alert" class="text-rose-600">{error}</p>{/if}
  <form on:submit|preventDefault={create} class="grid gap-3">
    <label
      >Subject<input
        required
        minlength="3"
        maxlength="180"
        bind:value={subject}
        class="theme-input block w-full p-3 border rounded"
      /></label
    ><label
      >Message<textarea
        required
        maxlength="10000"
        bind:value={body}
        class="theme-input block w-full p-3 border rounded"
      ></textarea></label
    ><button
      disabled={busy}
      class="min-h-[44px] px-4 py-2 rounded bg-emerald-700 text-white"
      >Start conversation</button
    >
  </form>
  <div class="grid gap-5 md:grid-cols-2">
    <div class="space-y-2">
      {#if $threads === undefined}<p>
          Loading conversations…
        </p>{:else if !$threads.page.length}<p>No conversations yet.</p>{/if}
      {#each $threads?.page ?? [] as thread}<button
          class="theme-surface block w-full text-left p-3 border rounded min-h-[44px]"
          on:click={() => {
            selected = thread;
            messageCursor = null;
            reply = "";
            reference = crypto.randomUUID();
          }}
          >{thread.subject}<span class="block text-sm"
            >{thread.status} · {new Date(
              thread.updatedAt,
            ).toLocaleString()}</span
          ></button
        >{/each}
      <button
        class="min-h-[44px] px-3 border rounded"
        disabled={!cursor}
        on:click={() => (cursor = null)}>Latest</button
      ><button
        class="min-h-[44px] px-3 border rounded"
        disabled={!$threads || $threads.isDone}
        on:click={() => (cursor = $threads?.continueCursor ?? null)}
        >Older conversations</button
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
              {message.authorRole} · {new Date(
                message.createdAt,
              ).toLocaleString()}
            </p>
            <p class="whitespace-pre-wrap break-words mt-2">{message.body}</p>
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
          >Earlier messages</button
        >
        {#if selected.status === "OPEN"}<form
            on:submit|preventDefault={send}
            class="space-y-3"
          >
            <label
              >Reply<textarea
                required
                maxlength="10000"
                bind:value={reply}
                class="theme-input block w-full p-3 border rounded"
              ></textarea></label
            ><ScannedAttachments bind:selected={attachments} /><button
              disabled={busy}
              class="min-h-[44px] rounded px-4 bg-emerald-700 text-white"
              >Send reply</button
            >
          </form>{/if}
      </div>{/if}
  </div>
</section>
