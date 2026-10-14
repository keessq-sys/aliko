<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  import { page } from "$app/stores";
  import { useQuery } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { adminGroups, isWorkspaceActive } from "$lib/navigation/workspace";
  const adkT = getTranslation();
  export let data: {
    session?: { user?: { role?: string; name?: string | null } } | null;
  };
  const stats = useQuery(api.projects.getPlatformStats, {});
  const requestCounts = useQuery(api.serviceRequests.getStatusCounts, {});
  $: currentGroup = adminGroups.find((group) =>
    group.items.some((item) => isWorkspaceActive(item.href, $page.url)),
  );
</script>

<div class="admin-workspace">
  <aside class="admin-sidebar">
    <div class="admin-sidebar-brand">
      <span aria-hidden="true">💎</span>
      <div>
        <strong>{$adkT("Admin Console")}</strong>
        <p>{$adkT("Aliko Diamond Key")}</p>
      </div>
    </div>
    <div class="admin-sidebar-stats">
      <a href="/admin/requests"
        ><strong>{$requestCounts?.counts.NEW ?? "—"}</strong><span
          >{$adkT("New Requests")}</span
        ></a
      >
      <a href="/admin/plots"
        ><strong>{$stats?.availablePlots ?? "—"}</strong><span
          >{$adkT("Available Plots")}</span
        ></a
      >
    </div>
    <nav aria-label={$adkT("Admin navigation")}>
      {#each adminGroups as group}<section>
          <h2>{$adkT(group.label)}</h2>
          {#each group.items as item}
            {@const count =
              item.badge === "new"
                ? $requestCounts?.counts.NEW
                : item.badge === "unverified"
                  ? $stats?.unverifiedPlots
                  : null}
            <a
              href={item.href}
              class:active={isWorkspaceActive(item.href, $page.url)}
              aria-current={isWorkspaceActive(item.href, $page.url)
                ? "page"
                : undefined}
              ><span class="workspace-nav-icon" aria-hidden="true"
                >{item.emoji}</span
              ><span>{$adkT(item.label)}</span>{#if count}<span
                  class="workspace-count">{count}</span
                >{/if}</a
            >
          {/each}
        </section>{/each}
    </nav>
    <p class="admin-sidebar-footer">
      {$adkT("Super Admin")} · {data.session?.user?.name ?? "Aliko Diamond Key"}
    </p>
  </aside>
  <div class="admin-main" dir={$page.data.locale === "ar" ? "rtl" : "ltr"}>
    <div class="workspace-context">
      <span
        >{$adkT("Admin Console")} <span aria-hidden="true">/</span>
        {$adkT(currentGroup?.label ?? "Overview")}</span
      ><span class="workspace-context-status"
        ><span aria-hidden="true">●</span>
        {$adkT("Authenticated workspace")}</span
      >
    </div>
    <slot />
  </div>
</div>
