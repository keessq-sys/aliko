<script lang="ts">
  import { useQuery } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { Bell, Mail, MessageSquare, Smartphone, Loader2 } from "lucide-svelte";
  import { formatRelative } from "$lib/utils/format";

  const notifications = useQuery(api.notifications.getRecentNotifications, { limit: 50 });

  const CHANNEL_ICONS: Record<string, any> = {
    EMAIL: Mail,
    WHATSAPP: MessageSquare,
    SMS: Smartphone,
    PUSH: Bell,
  };

  const CHANNELS = ["", "EMAIL", "WHATSAPP", "SMS", "PUSH"] as const;
  let channelFilter: (typeof CHANNELS)[number] = "";

  $: channelCounts = ($notifications ?? []).reduce((acc: Record<string, number>, n: any) => {
    acc[n.channel] = (acc[n.channel] ?? 0) + 1;
    return acc;
  }, {});

  $: filtered = ($notifications ?? []).filter((n: any) => !channelFilter || n.channel === channelFilter);
  $: sentCount = ($notifications ?? []).filter((n: any) => n.status === 'SENT').length;
  $: failedCount = ($notifications ?? []).filter((n: any) => n.status === 'FAILED').length;
</script>

<svelte:head><title>Notifications — ADK Admin</title></svelte:head>

<div class="p-8">
  <div class="mb-6">
    <h1 class="flex items-center gap-2 text-xl font-bold text-white"><Bell class="h-5 w-5 text-amber-400" /> Notification Log</h1>
    <p class="mt-0.5 text-sm text-stone-500">Every email, WhatsApp, SMS and push notification sent by the platform.</p>
  </div>

  <!-- Stat strip -->
  <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
    <div class="rounded-xl px-4 py-3" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06)">
      <p class="text-xl font-black text-white">{$notifications?.length ?? '—'}</p>
      <p class="text-xs text-stone-500">Total Logged</p>
    </div>
    <div class="rounded-xl px-4 py-3" style="background: rgba(5,150,105,0.08); border: 1px solid rgba(5,150,105,0.2)">
      <p class="text-xl font-black text-emerald-400">{sentCount}</p>
      <p class="text-xs text-stone-500">Sent</p>
    </div>
    <div class="rounded-xl px-4 py-3" style="background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.2)">
      <p class="text-xl font-black text-rose-400">{failedCount}</p>
      <p class="text-xs text-stone-500">Failed</p>
    </div>
  </div>

  <!-- Channel filter pills -->
  <div class="mb-6 flex flex-wrap gap-2">
    {#each CHANNELS as c}
      <button
        on:click={() => (channelFilter = c)}
        class="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all {channelFilter === c
          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          : 'bg-white/5 text-stone-400 border border-white/10 hover:text-white'}"
      >
        {#if c}<svelte:component this={CHANNEL_ICONS[c]} size={12} />{/if}
        {c || 'All'}
        {#if c}<span class="text-[10px] text-stone-500">{channelCounts[c] ?? 0}</span>{/if}
      </button>
    {/each}
  </div>

  <div class="overflow-hidden rounded-2xl" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
    {#if $notifications === undefined}
      <div class="flex items-center justify-center py-16 text-stone-500"><Loader2 class="h-6 w-6 animate-spin" /></div>
    {:else if filtered.length === 0}
      <p class="py-16 text-center text-sm text-stone-600">{$notifications.length === 0 ? "No notifications sent yet." : "No notifications on this channel."}</p>
    {:else}
      <div class="divide-y" style="border-color: rgba(255,255,255,0.04)">
        {#each filtered as n (n._id)}
          {@const Icon = CHANNEL_ICONS[n.channel] ?? Bell}
          <div class="flex items-center gap-4 px-6 py-4">
            <div class="rounded-lg bg-white/5 p-2.5 text-stone-400"><Icon size={16} /></div>
            <div class="flex-1 min-w-0">
              <p class="truncate text-sm text-white">{n.subject ?? n.message}</p>
              <p class="text-xs text-stone-600">To {n.recipient} · {n.channel.toLowerCase()}</p>
            </div>
            <span class="text-xs font-semibold {n.status === 'SENT' ? 'text-emerald-400' : n.status === 'FAILED' ? 'text-rose-400' : 'text-stone-500'}">{n.status}</span>
            <span class="hidden text-xs text-stone-600 sm:block">{formatRelative(new Date(n.createdAt))}</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
