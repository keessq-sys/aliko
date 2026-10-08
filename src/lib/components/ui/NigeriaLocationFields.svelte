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
  export let variant: "default" | "request" = "default";
  $: inputClass =
    variant === "request"
      ? "block w-full min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-white outline-none focus:border-emerald-500"
      : "theme-input block w-full min-h-[44px] rounded-lg border p-3";
  $: labelClass =
    variant === "request"
      ? "mb-1 block text-sm text-stone-400"
      : "block theme-text text-sm";
  $: optionClass = variant === "request" ? "bg-[#0A1118] text-white" : "";
  $: options = nigeriaLgas(state);
  $: if (lga && !options.includes(lga)) lga = "";
</script>

<div
  class="grid grid-cols-1 sm:grid-cols-2"
  class:gap-4={variant === "default"}
  class:gap-5={variant === "request"}
>
  <label class={variant === "request" ? "block" : "block theme-text text-sm"}>
    <span class={labelClass}>{$adkT("State / Abuja FCT")}</span>
    <select
      bind:value={state}
      {required}
      class={inputClass}
      on:change={() => (lga = "")}
    >
      <option class={optionClass} value=""
        >{$adkT(all ? "All states" : "Select state")}</option
      >
      {#each NIGERIAN_STATES as item}<option class={optionClass} value={item}
          >{$adkT(item)}</option
        >{/each}
    </select>
  </label>
  <label class={variant === "request" ? "block" : "block theme-text text-sm"}>
    <span class={labelClass}>{$adkT("Local Government Area")}</span>
    <select bind:value={lga} {required} disabled={!state} class={inputClass}>
      <option class={optionClass} value=""
        >{$adkT(all ? "All LGAs" : "Select LGA")}</option
      >
      {#each options as item}<option class={optionClass} value={item}
          >{$adkT(item)}</option
        >{/each}
    </select>
  </label>
</div>
