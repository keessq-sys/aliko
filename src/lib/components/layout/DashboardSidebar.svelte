<script lang="ts">
  import { getTranslation } from "$lib/i18n";

  const adkT = getTranslation();
  export let items: Array<{
    id: string;
    label: string;
    href?: string;
    icon?: any;
  }> = [];
  export let active = "";
  export let title = "Dashboard";
</script>

<aside class="dashboard-sidebar" dir="ltr">
  <div class="sidebar-heading">
    <strong>{$adkT(title)}</strong>
  </div>
  <nav aria-label={$adkT("Dashboard navigation")}>
    {#each items as item}
      {#if item.href}<a href={item.href} class:active={active === item.id}
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
    max-height: calc(100dvh - 64px);
    overflow-y: auto;
    position: sticky;
    top: 64px;
    align-self: flex-start;
    min-height: calc(100dvh - 64px);
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
  @media (max-width: 767px) {
    .dashboard-sidebar {
      display: none;
    }
  }
</style>
