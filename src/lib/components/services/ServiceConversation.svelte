<script lang="ts">
  import { Send, Loader2 } from 'lucide-svelte';
  import { api } from '$lib/convex/_generated/api';
  import { useQuery, runMutation } from '$lib/convex/queries';

  export let request: any;
  const messages = useQuery(api.serviceRequests.listMessages, { requestId: request._id as any });
  let body = '';
  let sending = false;
  let error = '';

  async function send() {
    const clean = body.trim();
    if (!clean) return;
    sending = true; error = '';
    try {
      await runMutation(api.serviceRequests.sendMessage, { requestId: request._id as any, body: clean });
      body = '';
    } catch (e) {
      error = (e as Error).message ?? 'Message could not be sent.';
    } finally { sending = false; }
  }
</script>

<div class="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
  <div class="mb-4 flex items-center justify-between gap-3">
    <div><h3 class="font-semibold text-white">{request.serviceSlug.replace(/-/g, ' ')}</h3><p class="font-mono text-xs text-stone-500">{request.reference}</p></div>
    <span class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">{request.status.replace(/_/g, ' ')}</span>
  </div>
  <div class="mb-4 max-h-72 space-y-3 overflow-y-auto rounded-xl bg-black/25 p-4">
    {#if $messages === undefined}<Loader2 class="mx-auto h-5 w-5 animate-spin text-stone-500" />
    {:else if $messages.length === 0}<p class="text-center text-sm text-stone-500">Start a conversation about this request.</p>
    {:else}{#each $messages as message (message._id)}
      <div class="flex {message.senderRole === 'CLIENT' ? 'justify-end' : 'justify-start'}">
        <div class="max-w-[85%] rounded-xl px-4 py-3 text-sm {message.senderRole === 'CLIENT' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-stone-200'}">
          <p>{message.body}</p><p class="mt-1 text-[10px] opacity-60">{message.senderRole === 'CLIENT' ? 'You' : 'Support'} · {new Date(message.createdAt).toLocaleString()}</p>
        </div>
      </div>
    {/each}{/if}
  </div>
  {#if error}<p class="mb-2 text-xs text-rose-300">{error}</p>{/if}
  <form class="flex gap-2" on:submit|preventDefault={send}>
    <input bind:value={body} maxlength="4000" placeholder="Write a message to support…" class="min-h-[44px] flex-1 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-emerald-500" />
    <button disabled={sending || !body.trim()} class="btn-primary flex min-h-[44px] items-center gap-2 px-4 disabled:opacity-50">{#if sending}<Loader2 class="h-4 w-4 animate-spin" />{:else}<Send class="h-4 w-4" />{/if} Send</button>
  </form>
</div>
