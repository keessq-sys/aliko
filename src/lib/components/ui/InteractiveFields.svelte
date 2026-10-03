<script lang="ts">
  import { onMount } from "svelte";
  export let spacing = "space-y-5";
  export let label = "";
  export let busy = false;
  let ready = false;
  onMount(() => {
    ready = true;
  });
</script>

<!-- These forms depend on browser handlers. Do not permit native submission
     or overwrite early autofill while the server-rendered page is hydrating. -->
<fieldset
  disabled={!ready || busy}
  aria-busy={!ready || busy}
  aria-label={label || undefined}
  class="min-w-0 {spacing}"
>
  <slot />
</fieldset>
