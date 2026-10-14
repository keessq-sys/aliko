<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  import LanguageSwitcher from "$lib/components/ui/LanguageSwitcher.svelte";
  import ThemeToggle from "$lib/components/ui/ThemeToggle.svelte";
  import { Menu, X, LogOut } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { runAction, useQuery } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { addToast } from "$lib/stores/ui";
  import {
    workspaceGroups,
    isWorkspaceActive,
  } from "$lib/navigation/workspace";
  const adkT = getTranslation();
  export let role = "CLIENT";
  const profile = useQuery(api.users.getMyProfile, {});
  let open = false,
    busy = false;
  let container: HTMLElement;
  let menuButton: HTMLButtonElement;
  $: displayName =
    $profile?.name ?? $page.data.session?.user?.name ?? "Account";
  $: groups = workspaceGroups(role);
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
      menuButton?.focus();
    }
  }
</script>

<svelte:window
  on:keydown={close}
  on:click={(event) => {
    if (!event.composedPath().includes(container)) open = false;
  }}
/>
<header bind:this={container} class="workspace-navigation" dir="ltr">
  <a
    class="workspace-brand"
    href="/"
    aria-label={$adkT("Aliko Diamond Key home")}
    ><img
      src="/adk-logo.png"
      alt={$adkT("Aliko Diamond Key")}
      width="48"
      height="44"
    /></a
  >
  <div class="workspace-controls">
    <ThemeToggle />
    <button
      bind:this={menuButton}
      type="button"
      class="workspace-menu-toggle"
      aria-label={$adkT(open ? "Close menu" : "Open menu")}
      aria-expanded={open}
      aria-controls="workspace-navigation-menu"
      on:click={() => (open = !open)}
    >
      {#if open}<X size={22} />{:else}<Menu size={22} />{/if}
    </button>
  </div>
  {#if open}
    <nav
      id="workspace-navigation-menu"
      class="workspace-menu"
      aria-label={$adkT("Workspace navigation")}
      dir={$page.data.locale === "ar" ? "rtl" : "ltr"}
    >
      <div class="workspace-account-summary">
        {#if $profile?.avatarUrl}<img
            src={$profile.avatarUrl}
            alt=""
            class="workspace-avatar"
          />{:else}<span class="workspace-avatar" aria-hidden="true"
            >{displayName.slice(0, 1).toUpperCase()}</span
          >{/if}
        <div>
          <strong>{displayName}</strong>
          <p>
            {$adkT(
              role === "ADMIN"
                ? "Super Admin"
                : role === "AGENT"
                  ? "Agent Portal"
                  : role === "ESTATE_MANAGER"
                    ? "Estate Manager"
                    : "Client Portal",
            )}
          </p>
        </div>
      </div>
      <div class="workspace-language">
        <span>Language / اللغة</span><LanguageSwitcher />
      </div>
      {#each groups as group}
        <section class="workspace-menu-group">
          <h2>{$adkT(group.label)}</h2>
          {#each group.items as item}<a
              href={item.href}
              class:active={isWorkspaceActive(item.href, $page.url)}
              aria-current={isWorkspaceActive(item.href, $page.url)
                ? "page"
                : undefined}
              on:click={() => (open = false)}
              ><span class="workspace-nav-icon" aria-hidden="true"
                >{item.emoji}</span
              ><span>{$adkT(item.label)}</span></a
            >{/each}
        </section>
      {/each}
      <button
        type="button"
        class="workspace-logout"
        on:click={logout}
        disabled={busy}><LogOut size={18} />{$adkT("Logout")}</button
      >
    </nav>
  {/if}
</header>
