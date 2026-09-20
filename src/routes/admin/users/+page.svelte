<script lang="ts">
  import { UserCog, Loader2, ShieldCheck, ShieldAlert } from "lucide-svelte";
  import { formatRelative } from "$lib/utils/format";

  interface UserRow {
    _id: string;
    name?: string;
    email?: string;
    role?: string;
    kycVerified?: boolean;
    isDiaspora?: boolean;
    createdAt?: number;
  }

  export let data: { users?: UserRow[] } = {};

  const ROLE_BADGES: Record<string, string> = {
    ADMIN: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
    AGENT: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
    ESTATE_MANAGER: "bg-blue-500/15 text-blue-300 border border-blue-500/30",
    CLIENT: "bg-stone-500/15 text-stone-300 border border-stone-500/30",
    DIASPORA_CLIENT: "bg-purple-500/15 text-purple-300 border border-purple-500/30",
    TENANT: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  };

  const users: UserRow[] = data.users ?? [];
</script>

<svelte:head><title>Users & Roles — ADK Admin</title></svelte:head>

<div class="p-8">
  <div class="mb-6">
    <h1 class="flex items-center gap-2 text-xl font-bold text-white"><UserCog class="h-5 w-5 text-purple-400" /> Users & Roles</h1>
    <p class="mt-0.5 text-sm text-stone-500">Every account on the platform, grouped by role. Wire to <code class="text-emerald-500">api.users.listAll</code> once user queries are added.</p>
  </div>

  <div class="overflow-hidden rounded-2xl" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
    {#if users.length === 0}
      <p class="py-16 text-center text-sm text-stone-600">
        User roster loads once a Convex deployment is connected. The users table schema (role, KYC state, diaspora flag) is already live in <code class="text-emerald-500">convex/schema.ts</code>.
      </p>
    {:else}
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
          {#each users as user (user._id)}
            <tr class="hover:bg-white/5">
              <td class="px-6 py-4">
                <p class="font-medium text-white">{user.name ?? "—"}</p>
                <p class="text-xs text-stone-500">{user.email ?? "—"}</p>
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
    {/if}
  </div>
</div>
