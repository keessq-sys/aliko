<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();
  onMount(() => {
    void goto("/register/manager", { replaceState: true });
  });
</script>

<p class="theme-text">
  {$adkT("Complete your account and professional enrolment in one form.")}
</p>
<a class="btn-primary mt-4" href="/register/manager">{$adkT("Continue")}</a>
