<script lang="ts">
  import { useQuery, runMutation } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { MessageSquare, Loader2, ExternalLink, CheckCircle } from "lucide-svelte";
  import { formatRelative } from "$lib/utils/format";

  const queue = useQuery(api.whatsapp.getHumanReviewQueue, {});
  const resolveSession = async (args: any) => runMutation(api.whatsapp.resolveSession, args);

  let actingId: string | null = null;

  async function resolve(id: any) {
    actingId = String(id);
    try {
      await resolveSession({ sessionId: id });
    } catch {
      /* surfaced via query refresh */
    } finally {
      actingId = null;
    }
  }
</script>

<svelte:head><title>WhatsApp Queue — ADK Admin</title></svelte:head>

<div class="p-8">
  <div class="mb-6">
    <h1 class="flex items-center gap-2 text-xl font-bold text-white"><MessageSquare class="h-5 w-5 text-emerald-400" /> WhatsApp Review Queue</h1>
    <p class="mt-0.5 text-sm text-stone-500">Conversations the bot escalated to a human agent.</p>
  </div>

  <div class="overflow-hidden rounded-2xl" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
    {#if $queue === undefined}
      <div class="flex items-center justify-center py-16 text-stone-500"><Loader2 class="h-6 w-6 animate-spin" /></div>
    {:else if $queue.length === 0}
      <p class="py-16 text-center text-sm text-stone-600">No sessions awaiting human review.</p>
    {:else}
      <div class="divide-y" style="border-color: rgba(255,255,255,0.04)">
        {#each $queue as session (session._id)}
          <div class="flex flex-wrap items-center gap-4 px-6 py-4">
            <div class="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400"><MessageSquare size={16} /></div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-white">{session.phone}</p>
              <p class="text-xs text-stone-600">State: {session.state} · updated {formatRelative(new Date(session.updatedAt))}</p>
            </div>
            <a
              href="https://wa.me/{session.phone.replace(/[^0-9]/g, '')}"
              target="_blank"
              class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white"
              style="background: rgba(37, 211, 102, 0.15); border: 1px solid rgba(37,211,102,0.3)"
            >
              <ExternalLink size={12} /> Open Chat
            </a>
            <button
              on:click={() => resolve(session._id)}
              disabled={actingId === String(session._id)}
              class="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
            >
              {#if actingId === String(session._id)}<Loader2 size={12} class="animate-spin" />{:else}<CheckCircle size={12} />{/if}
              Resolve
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
