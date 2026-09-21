<script lang="ts">
  import { useQuery } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { UserCog, Loader2, ShieldCheck, ShieldAlert, Search } from "lucide-svelte";
  import { formatRelative } from "$lib/utils/format";

  const ROLE_BADGES: Record<string, string> = {
    ADMIN: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
    AGENT: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
    ESTATE_MANAGER: "bg-blue-500/15 text-blue-300 border border-blue-500/30",
    CLIENT: "bg-stone-500/15 text-stone-300 border border-stone-500/30",
    DIASPORA_CLIENT: "bg-purple-500/15 text-purple-300 border border-purple-500/30",
    TENANT: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  };

  const ROLE_FILTERS = ["", "ADMIN", "AGENT", "CLIENT", "ESTATE_MANAGER", "DIASPORA_CLIENT", "TENANT"] as const;

  let roleFilter: (typeof ROLE_FILTERS)[number] = "";
  let search = "";

  const users = useQuery(api.users.listUsers, {});
  const roleCounts = useQuery(api.users.getRoleCounts, {});

  $: filtered = ($users ?? []).filter((u: any) => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q);
  });
</script>

<svelte:head><title>Users & Roles — ADK Admin</title></svelte:head>

<div class="p-8">
  <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div>
      <h1 class="flex items-center gap-2 text-xl font-bold text-white"><UserCog class="h-5 w-5 text-purple-400" /> Users & Roles</h1>
      <p class="mt-0.5 text-sm text-stone-500">Every account on the platform, live from the database.</p>
    </div>
    <div class="relative">
      <Search class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-500" />
      <input type="text" bind:value={search} placeholder="Search name or email…" class="w-64 rounded-xl border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-xs text-white placeholder-stone-600 outline-none focus:border-emerald-500" />
    </div>
  </div>

  <!-- Role filter pills -->
  <div class="mb-6 flex flex-wrap gap-2">
    {#each ROLE_FILTERS as r}
      <button
        on:click={() => (roleFilter = r)}
        class="rounded-full px-3.5 py-1.5 text-xs font-medium transition-all {roleFilter === r
          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
          : 'bg-white/5 text-stone-400 border border-white/10 hover:text-white'}"
      >
        {r || "All"}
        {#if $roleCounts && r}
          <span class="ml-1 text-[10px] text-stone-500">{$roleCounts.counts[r] ?? 0}</span>
        {:else if $roleCounts && !r}
          <span class="ml-1 text-[10px] text-stone-500">{$roleCounts.total}</span>
        {/if}
      </button>
    {/each}
  </div>

  <div class="overflow-hidden rounded-2xl" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
    {#if $users === undefined}
      <div class="flex items-center justify-center py-16 text-stone-500"><Loader2 class="h-6 w-6 animate-spin" /></div>
    {:else if filtered.length === 0}
      <p class="py-16 text-center text-sm text-stone-600">
        {$users.length === 0 ? "No users yet — accounts appear here as soon as they sign up." : "No users match this filter."}
      </p>
    {:else}
      <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-white/5 text-stone-400">
          <tr>
            <th class="px-6 py-4">User</th>
            <th class="px-6 py-4">Role</th>
            <th class="px-6 py-4">KYC</th>
            <th class="px-6 py-4">Joined</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          {#each filtered as user (user._id)}
            <tr class="hover:bg-white/5">
              <td class="px-6 py-4">
                <p class="font-medium text-white">{user.name ?? "—"}</p>
                <p class="text-xs text-stone-500">{user.email ?? "—"}{user.isDiaspora ? ' · Diaspora' : ''}</p>
              </td>
              <td class="px-6 py-4">
                <span class="rounded-full px-2.5 py-1 text-xs font-semibold {ROLE_BADGES[user.role ?? 'CLIENT'] ?? ROLE_BADGES.CLIENT}">
                  {user.role ?? "CLIENT"}
                </span>
              </td>
              <td class="px-6 py-4">
                {#if user.kycVerified}
                  <span class="inline-flex items-center gap-1 text-xs text-emerald-400"><ShieldCheck size={13} /> Verified</span>
                {:else}
                  <span class="inline-flex items-center gap-1 text-xs text-stone-500"><ShieldAlert size={13} /> Pending</span>
                {/if}
              </td>
              <td class="px-6 py-4 text-stone-400">{user.createdAt ? formatRelative(new Date(user.createdAt)) : "—"}</td>
            </tr>
          {/each}
        </tbody>
      </table>
      </div>
    {/if}
  </div>
</div>
