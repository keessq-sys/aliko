<script lang="ts">
  import { api } from "$lib/convex/_generated/api";
  import { useQuery } from "$lib/convex/queries";
  const testimonials = useQuery(api.content.testimonials, {});
</script>

{#if $testimonials?.length}<section class="theme-surface theme-text py-20">
    <div class="container mx-auto px-6">
      <h2 class="text-3xl font-semibold mb-8">Client experiences</h2>
      <div class="grid md:grid-cols-3 gap-6">
        {#each $testimonials as row}<figure class="border rounded-2xl p-6">
            <blockquote class="whitespace-pre-wrap">{row.quote}</blockquote>
            <figcaption class="mt-4 font-semibold">
              {row.author} · {row.location}
            </figcaption>
          </figure>{/each}
      </div>
    </div>
  </section>{/if}
