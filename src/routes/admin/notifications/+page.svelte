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
</script>

<svelte:head><title>Notifications — ADK Admin</title></svelte:head>

<div class="p-8">
  <div class="mb-6">
    <h1 class="flex items-center gap-2 text-xl font-bold text-white"><Bell class="h-5 w-5 text-amber-400" /> Notification Log</h1>
    <p class="mt-0.5 text-sm text-stone-500">Every email, WhatsApp, SMS and push notification sent by the platform.</p>
  </div>

  <div class="overflow-hidden rounded-2xl" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
    {#if $notifications === undefined}
      <div class="flex items-center justify-center py-16 text-stone-500"><Loader2 class="h-6 w-6 animate-spin" /></div>
    {:else if $notifications.length === 0}
      <p class="py-16 text-center text-sm text-stone-600">No notifications sent yet.</p>
    {:else}
      <div class="divide-y" style="border-color: rgba(255,255,255,0.04)">
        {#each $notifications as n (n._id)}
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
