<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();
</script>

<div class="theme-surface theme-text min-h-screen p-8">
  <h1 class="text-3xl font-bold">{$adkT("Secure Checkout")}</h1>
  <p class="my-4">
    {$adkT(
      "Choose a property, reserve a land plot, or open an approved service quote to review its payment.",
    )}
  </p>
  <div class="flex flex-wrap gap-4">
    <a class="btn-primary" href="/properties">{$adkT("Properties")}</a><a
      class="btn-primary"
      href="/plots">{$adkT("Land Plots")}</a
    ><a class="btn-primary" href="/dashboard/payments">{$adkT("My payments")}</a
    >
  </div>
</div>
