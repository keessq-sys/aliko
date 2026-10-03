<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  import { Menu, X } from "lucide-svelte";
  const adkT = getTranslation();
  export let items: Array<{
    id: string;
    label: string;
    href?: string;
    icon?: any;
  }> = [];
  export let active = "";
  export let title = "Dashboard";
  let open = false;
</script>

<svelte:window
  on:keydown={(event) => {
    if (event.key === "Escape") open = false;
  }}
/>
<div class="sidebar-toggle md:hidden">
  <button
    type="button"
    aria-label={$adkT("Open sidebar")}
    aria-expanded={open}
    on:click={() => (open = !open)}
    ><Menu size={20} /><span>{$adkT(title)}</span></button
  >
</div>
{#if open}<div
    class="sidebar-dismiss md:hidden"
    role="presentation"
    on:click={() => (open = false)}
  ></div>{/if}
<aside class="dashboard-sidebar" class:opened={open} dir="ltr">
  <div class="sidebar-heading">
    <strong>{$adkT(title)}</strong><button
      type="button"
      class="md:hidden"
      aria-label={$adkT("Close sidebar")}
      on:click={() => (open = false)}><X size={20} /></button
    >
  </div>
  <nav aria-label={$adkT("Dashboard navigation")}>
    {#each items as item}
      {#if item.href}<a
          href={item.href}
          class:active={active === item.id}
          on:click={() => (open = false)}
          >{#if item.icon}<svelte:component
              this={item.icon}
              size={18}
            />{/if}{$adkT(item.label)}</a
        >
      {:else}<button
          type="button"
          class:active={active === item.id}
          on:click={() => {
            active = item.id;
            open = false;
          }}
          >{#if item.icon}<svelte:component
              this={item.icon}
              size={18}
            />{/if}{$adkT(item.label)}</button
        >{/if}
    {/each}
  </nav>
</aside>

<style>
  .dashboard-sidebar {
    width: 224px;
    flex-shrink: 0;
    background: var(--surface, #0a1628);
    color: var(--text-main, #f8fafc);
    border-right: 1px solid var(--border-soft, #75828a);
    padding: 16px 10px;
    max-height: calc(100dvh - 58px);
    overflow-y: auto;
    position: sticky;
    top: 58px;
    align-self: flex-start;
    min-height: calc(100dvh - 58px);
  }
  .sidebar-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 10px;
    margin-bottom: 12px;
  }
  nav {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  nav a,
  nav button {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 12px;
    min-height: 44px;
    border-radius: 8px;
    text-align: start;
  }
  nav a:hover,
  nav button:hover {
    background: #64748b22;
  }
  .active {
    background: #065f46;
    color: white;
  }
  .sidebar-toggle button {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    padding: 8px 12px;
  }
  .sidebar-dismiss {
    position: fixed;
    inset: 58px 0 0;
    background: #0005;
    z-index: 70;
  }
  @media (max-width: 767px) {
    .dashboard-sidebar {
      display: none;
    }
    .dashboard-sidebar.opened {
      display: block;
      position: fixed;
      top: 58px;
      left: 0;
      bottom: 0;
      z-index: 80;
      width: min(260px, 85vw);
    }
    .sidebar-heading button {
      min-height: 44px;
      min-width: 44px;
    }
  }
</style>
