<script lang="ts">
  import { Eye, EyeOff } from "lucide-svelte";
  import {
    passwordProblem,
    passwordScore,
  } from "../../../../convex/lib/passwordPolicy";
  export let value = "";
  export let strength = false;
  let visible = false;
  $: score = passwordScore(value);
</script>

<div class="relative">
  <input
    {...$$restProps}
    type={visible ? "text" : "password"}
    bind:value
    style:padding-right="3rem"
    class={`theme-input min-h-[44px] w-full rounded-lg border px-3 py-2.5 pr-12 ${$$restProps.class ?? ""}`}
  />
  <button
    type="button"
    class="absolute right-1 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center text-stone-400"
    aria-label={visible ? "Hide password" : "Show password"}
    aria-pressed={visible}
    on:click={() => (visible = !visible)}
  >
    {#if visible}<EyeOff size={18} />{:else}<Eye size={18} />{/if}
  </button>
</div>
{#if strength}
  <meter
    class="mt-2 h-2 w-full"
    min="0"
    max="5"
    value={score}
    aria-label="Password strength"
  ></meter>
  <p class="mt-1 text-xs text-stone-400" aria-live="polite">
    {value && !passwordProblem(value)
      ? "Strong password"
      : "Use at least 12 characters: uppercase, lowercase, a number and a symbol."}
  </p>
{/if}
