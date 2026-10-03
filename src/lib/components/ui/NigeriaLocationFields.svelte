<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  import {
    NIGERIAN_STATES,
    nigeriaLgas,
    normalizeState,
  } from "../../../../convex/lib/nigeriaLocations";
  const adkT = getTranslation();
  export let state = "";
  export let lga = "";
  export let required = false;
  export let all = false;
  $: options = nigeriaLgas(state);
  $: if (lga && !options.includes(lga)) lga = "";
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <label class="block theme-text text-sm"
    >{$adkT("State / Abuja FCT")}
    <select
      bind:value={state}
      {required}
      class="theme-input block w-full min-h-[44px] rounded-lg border p-3"
      on:change={() => (lga = "")}
    >
      <option value="">{$adkT(all ? "All states" : "Select state")}</option>
      {#each NIGERIAN_STATES as item}<option value={item}>{$adkT(item)}</option
        >{/each}
    </select>
  </label>
  <label class="block theme-text text-sm"
    >{$adkT("Local Government Area")}
    <select
      bind:value={lga}
      {required}
      disabled={!state}
      class="theme-input block w-full min-h-[44px] rounded-lg border p-3"
    >
      <option value="">{$adkT(all ? "All LGAs" : "Select LGA")}</option>
      {#each options as item}<option value={item}>{$adkT(item)}</option>{/each}
    </select>
  </label>
</div>
