<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  import LanguageSwitcher from "$lib/components/ui/LanguageSwitcher.svelte";
  import ThemeToggle from "$lib/components/ui/ThemeToggle.svelte";
  import { ArrowLeft, ArrowRight, LogOut, ChevronDown } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { runAction, useQuery } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { addToast } from "$lib/stores/ui";
  const adkT = getTranslation();
  export let role = "CLIENT";
  const profile = useQuery(api.users.getMyProfile, {});
  let open = false,
    busy = false;
  let container: HTMLDivElement;
  let accountButton: HTMLButtonElement;
  $: displayName =
    $profile?.name ?? $page.data.session?.user?.name ?? "Account";
  $: dashboard =
    role === "ADMIN"
      ? "/admin"
      : role === "AGENT"
        ? "/dashboard/agent"
        : role === "ESTATE_MANAGER"
          ? "/dashboard/manager"
          : "/dashboard/client";
  const sections: Record<string, Array<[string, string]>> = {
    CLIENT: [
      ["bookings", "My Bookings"],
      ["requests", "My Requests"],
      ["saved", "Saved"],
      ["viewings", "Viewings"],
      ["documents", "Documents"],
      ["messages", "Messages"],
      ["profile", "Profile"],
    ],
    AGENT: [
      ["overview", "Overview"],
      ["listings", "My Listings"],
      ["leads", "My Leads"],
      ["referrals", "Service Referrals"],
      ["commissions", "Commissions"],
      ["schedule", "Schedule"],
      ["messages", "Messages"],
      ["settings", "Settings"],
    ],
    ESTATE_MANAGER: [
      ["overview", "Overview"],
      ["properties", "My Properties"],
      ["tenants", "Tenants"],
      ["facility", "Facility & Maintenance"],
      ["agents", "My Agents"],
      ["financials", "Financials"],
      ["documents", "Documents"],
      ["reports", "Reports"],
      ["settings", "Settings"],
    ],
  };
  $: sectionLinks =
    role === "ADMIN"
      ? [
          { href: "/admin/requests", label: "Requests Inbox" },
          { href: "/admin/users", label: "User Management" },
          { href: "/admin/properties", label: "Properties" },
          { href: "/admin/services", label: "Services" },
          { href: "/admin/finance", label: "Reconciliation" },
          { href: "/admin/messages", label: "Conversations" },
        ]
      : (sections[role] ?? sections.CLIENT).map(([id, label]) => ({
          href: dashboard + "#" + id,
          label,
        }));
  $: if ($page.url) open = false;
  async function logout() {
    busy = true;
    try {
      await runAction(api.auth.signOut, {});
      await goto("/", { invalidateAll: true });
    } catch {
      addToast({
        type: "error",
        message: "Sign out could not be confirmed. Please retry.",
      });
    } finally {
      busy = false;
    }
  }
  function close(event: KeyboardEvent) {
    if (event.key === "Escape" && open) {
      open = false;
      accountButton?.focus();
    }
  }
</script>

<svelte:window
  on:keydown={close}
  on:click={(event) => {
    if (!event.composedPath().includes(container)) open = false;
  }}
/>
<div bind:this={container} class="workspace-navigation" dir="ltr">
  <a
    class="workspace-brand"
    href="/"
    aria-label={$adkT("Aliko Diamond Key home")}
    ><img
      src="/adk-logo.png"
      alt={$adkT("Aliko Diamond Key")}
      width="46"
      height="40"
    /></a
  >
  <div class="workspace-controls">
    <button
      type="button"
      aria-label={$adkT("Go back")}
      on:click={() => window.history.back()}><ArrowLeft size={18} /></button
    >
    <button
      type="button"
      aria-label={$adkT("Go forward")}
      on:click={() => window.history.forward()}><ArrowRight size={18} /></button
    >
    <LanguageSwitcher /><ThemeToggle />
    <button
      bind:this={accountButton}
      type="button"
      class="account-toggle"
      aria-label={$adkT("Account")}
      aria-expanded={open}
      aria-controls="workspace-account-menu"
      on:click={() => (open = !open)}
    >
      {#if $profile?.avatarUrl}<img
          src={$profile.avatarUrl}
          alt={$adkT("Your profile")}
          class="avatar"
        />{:else}<span class="avatar initials" aria-hidden="true"
          >{displayName.slice(0, 1).toUpperCase()}</span
        >{/if}
      <span class="account-name">{displayName}</span><ChevronDown size={16} />
    </button>
  </div>
  {#if open}
    <nav
      id="workspace-account-menu"
      class="workspace-menu"
      aria-label={$adkT("Account navigation")}
      dir={$page.data.locale === "ar" ? "rtl" : "ltr"}
    >
      <p class="account-heading">{displayName}</p>
      <a href={dashboard}>{$adkT("Dashboard")}</a>
      {#each sectionLinks as item}<a href={item.href}>{$adkT(item.label)}</a
        >{/each}
      <hr />
      {#each [{ href: "/dashboard/account", label: "My profile" }, { href: "/dashboard/payments", label: "My payments" }, { href: "/dashboard/messages", label: "Company conversations" }, { href: "/properties", label: "Properties" }, { href: "/services", label: "Services" }, { href: "/", label: "Website home" }] as item}
        <a href={item.href}>{$adkT(item.label)}</a>
      {/each}
      <button type="button" on:click={logout} disabled={busy}
        ><LogOut size={18} />{$adkT("Logout")}</button
      >
    </nav>
  {/if}
</div>

<style>
  .workspace-navigation {
    position: sticky;
    top: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 58px;
    z-index: 90;
    background: var(--surface, #10202b);
    color: var(--text-main, #f8fafc);
    border-bottom: 1px solid var(--border-soft, #75828a);
  }
  .workspace-controls {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
    padding-right: 10px;
  }
  button {
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: 8px;
  }
  button:hover,
  a:hover {
    background: #64748b22;
  }
  .workspace-menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 10px;
    width: min(320px, calc(100vw - 20px));
    max-height: min(70dvh, 620px);
    overflow-y: auto;
    overscroll-behavior: contain;
    border: 1px solid var(--border-soft, #75828a);
    border-radius: 12px;
    background: var(--surface, #10202b);
    padding: 8px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 12px 32px #0004;
  }
  .workspace-brand {
    padding: 4px 12px;
  }
  .workspace-brand img {
    background: white;
    border-radius: 6px;
    object-fit: contain;
  }
  .avatar {
    width: 34px;
    height: 34px;
    object-fit: cover;
    border-radius: 50%;
  }
  .initials {
    display: grid;
    place-items: center;
    background: #065f46;
    color: white;
    font-weight: 700;
  }
  .account-name {
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .account-heading {
    padding: 10px;
    font-weight: 700;
  }
  .workspace-menu a,
  .workspace-menu button {
    padding: 10px 12px;
    min-height: 44px;
    border-radius: 8px;
    text-align: start;
    justify-content: flex-start;
  }
  hr {
    border-color: var(--border-soft);
    margin: 6px;
  }
  @media (max-width: 640px) {
    .account-name {
      display: none;
    }
    .workspace-controls {
      gap: 0;
      padding-right: 4px;
    }
    .workspace-brand {
      padding: 4px;
    }
    .workspace-brand img {
      width: 36px;
    }
    .workspace-controls > button:not(.account-toggle) {
      min-width: 34px;
    }
  }
</style>
