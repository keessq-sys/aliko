<script lang="ts">
  import { Building2, Users, MapPin, ShieldCheck } from "lucide-svelte";
  import { api } from "$lib/convex/_generated/api";
  import { useQuery } from "$lib/convex/queries";
  const summary = useQuery(api.catalog.publicSummary, {});
  $: stats = [
    { label: "Published listings", value: $summary?.listings, icon: Building2 },
    { label: "Approved agents", value: $summary?.agents, icon: Users },
    { label: "Active developments", value: $summary?.projects, icon: MapPin },
  ];
</script>

<section
  class="theme-surface border-y border-white/10 py-12"
  aria-label="Live catalogue figures"
>
  <div class="container mx-auto grid grid-cols-2 gap-8 px-6 md:grid-cols-4">
    {#each stats as stat}<div class="text-center">
        <svelte:component
          this={stat.icon}
          size={28}
          class="mx-auto mb-3 text-emerald-600"
        />
        <p class="theme-text text-4xl font-bold">
          {stat.value ?? "—"}{#if $summary?.capped && stat.value === 500}+{/if}
        </p>
        <p class="theme-muted mt-2 text-sm">{stat.label}</p>
      </div>{/each}
    <div class="text-center">
      <ShieldCheck size={28} class="mx-auto mb-3 text-emerald-600" />
      <p class="theme-text text-lg font-semibold">Review before publication</p>
      <p class="theme-muted mt-2 text-sm">
        Listings require administrator approval.
      </p>
    </div>
  </div>
</section>
