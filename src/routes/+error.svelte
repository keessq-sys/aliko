<script lang="ts">
  import { page } from "$app/stores";
  import { Diamond, Home, ArrowLeft } from "lucide-svelte";
</script>

<svelte:head>
  <title>{$page.status} — Aliko Diamond Key</title>
</svelte:head>

<div class="min-h-screen flex flex-col items-center justify-center px-4 text-center" style="background: var(--c-obsidian)">
  <div class="relative mb-8">
    <div class="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
         style="background: linear-gradient(135deg, #D97706, #92400E)">
      <Diamond class="w-10 h-10 text-white" />
    </div>
    <div class="absolute -top-1 -right-1 w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm"
         style="background: rgba(220,38,38,0.2); color: #f87171; border: 1px solid rgba(220,38,38,0.3)">
      {$page.status}
    </div>
  </div>

  <h1 class="font-serif text-display-md text-white mb-3" style="letter-spacing:-0.02em">
    {$page.status === 404 ? "Page Not Found" : "Something Went Wrong"}
  </h1>
  <p class="text-stone-400 max-w-sm mb-8">
    {$page.error?.message ?? (
      $page.status === 404
        ? "The page you're looking for doesn't exist or has been moved."
        : "An unexpected error occurred. Our team has been notified."
    )}
  </p>

  <div class="flex gap-3">
    <button on:click={() => history.back()}
            class="flex items-center gap-2 px-5 py-3 rounded-xl text-stone-400 hover:text-white border border-white/10 hover:bg-white/5 transition-all text-sm font-medium">
      <ArrowLeft class="w-4 h-4" /> Go back
    </button>
    <a href="/" class="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:scale-105"
       style="background: linear-gradient(135deg, #059669, #065f46)">
      <Home class="w-4 h-4" /> Home
    </a>
  </div>
</div>
