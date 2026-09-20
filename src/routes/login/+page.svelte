<script lang="ts">
  import { Diamond } from "lucide-svelte";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { api } from "$lib/convex/_generated/api";
  import { runMutation } from "$lib/convex/queries";
  import LoginForm from "$lib/components/auth/LoginForm.svelte";

  let signedOut = false;

  onMount(async () => {
    if ($page.url.searchParams.get("signout") === "1") {
      try {
        await runMutation(api.auth.signOut, {});
      } catch {
        /* already signed out / no active session */
      }
      signedOut = true;
      goto("/login", { replaceState: true });
    }
  });
</script>

<svelte:head><title>Sign In — Aliko Diamond Key</title></svelte:head>

<div class="min-h-screen flex items-center justify-center px-4 py-12" style="background: var(--c-obsidian)">
  <!-- BG glow -->
  <div class="fixed inset-0 pointer-events-none" style="background: radial-gradient(ellipse 70% 50% at 50% -10%, rgba(6,78,59,0.3) 0%, transparent 60%)" />

  <div class="relative w-full max-w-md">
    <!-- Logo -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
           style="background: linear-gradient(135deg, #D97706, #92400E)">
        <Diamond class="w-7 h-7 text-white" />
      </div>
      <h1 class="font-serif text-2xl text-white">Welcome back</h1>
      <p class="text-stone-500 text-sm mt-1">Sign in to your Aliko Diamond Key account</p>
      {#if signedOut}
        <p class="mt-3 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
          You've been signed out.
        </p>
      {/if}
    </div>

    <!-- Card -->
    <div class="rounded-2xl p-8" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
      <LoginForm />
    </div>

    <p class="text-center text-stone-700 text-xs mt-6">
      Don't have an account? <a href="/auth?tab=signup" class="text-emerald-500 hover:text-emerald-400">Create one →</a>
    </p>
  </div>
</div>
