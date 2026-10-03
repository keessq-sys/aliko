<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();

  import LanguageSwitcher from "$lib/components/ui/LanguageSwitcher.svelte";
  import { Menu, X, ArrowLeft, ArrowRight, LogOut } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import ThemeToggle from "$lib/components/ui/ThemeToggle.svelte";
  import { runAction } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { addToast } from "$lib/stores/ui";
  export let role = "CLIENT";
  let open = false;
  let busy = false;
  $: dashboard =
    role === "ADMIN"
      ? "/admin"
      : role === "AGENT"
        ? "/dashboard/agent"
        : role === "ESTATE_MANAGER"
          ? "/dashboard/manager"
          : "/dashboard/client";
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
</script>

<div class="workspace-navigation" dir="ltr">
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
  <nav
    aria-label={$adkT("Account navigation")}
    class="flex items-center gap-1 p-1"
  >
    <LanguageSwitcher />
    <ThemeToggle />
    <button
      aria-label={$adkT(
        open ? "Close account navigation" : "Open account navigation",
      )}
      aria-expanded={open}
      on:click={() => (open = !open)}
      >{#if open}<X size={20} />{:else}<Menu size={20} />{/if}</button
    >
  </nav>
  {#if open}<div class="workspace-menu">
      <div class="flex gap-2">
        <button
          aria-label={$adkT("Go back")}
          title={$adkT("Go back")}
          on:click={() => window.history.back()}><ArrowLeft size={18} /></button
        >
        <button
          aria-label={$adkT("Go forward")}
          title={$adkT("Go forward")}
          on:click={() => window.history.forward()}
          ><ArrowRight size={18} /></button
        >
      </div>
      <button on:click={logout} disabled={busy} aria-label={$adkT("Logout")}
        ><LogOut size={18} /><span class="hidden sm:inline"
          >{$adkT("Logout")}</span
        ></button
      >

      {#each [{ href: dashboard, label: "Dashboard" }, { href: "/dashboard/account", label: "My profile" }, { href: "/dashboard/messages", label: "Company conversations" }, { href: "/dashboard/payments", label: "My payments" }, { href: "/properties", label: "Properties" }, { href: "/services", label: "Services" }, { href: "/", label: "Website home" }] as item}<a
          href={item.href}
          on:click={() => (open = false)}>{$adkT(item.label)}</a
        >{/each}
    </div>{/if}
</div>

<style>
  .workspace-navigation {
    position: sticky;
    top: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    min-height: 58px;
    z-index: 90;
    background: var(--surface, #10202b);
    color: var(--text-main, #f8fafc);
    border: 1px solid #75828a;
    border-radius: 0;
    box-shadow: 0 4px 18px #0003;
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
  button:hover {
    background: #64748b33;
  }
  .workspace-menu {
    position: absolute;
    top: 100%;
    right: 12px;
    min-width: 240px;
    border: 1px solid #75828a;
    border-radius: 12px;
    background: inherit;
    padding: 8px;
    border-top: 1px solid #75828a;
    display: flex;
    flex-direction: column;
  }
  .workspace-brand {
    padding: 4px 12px;
  }
  .workspace-brand img {
    background: white;
    border-radius: 6px;
    object-fit: contain;
  }
  a {
    padding: 12px;
    border-radius: 8px;
  }
  a:hover {
    background: #64748b33;
  }
  :global(html[data-theme="light"]) .workspace-navigation {
    background: #fff;
    color: #111827;
  }
</style>
