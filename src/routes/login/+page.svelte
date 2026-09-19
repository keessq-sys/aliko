<script lang="ts">
  import { Diamond, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  let mode: "signin" | "otp" = "signin";
  let email = "";
  let password = "";
  let otp = "";
  let otpStep: "request" | "verify" = "request";
  let showPassword = false;
  let loading = false;
  let error = "";

  $: redirectTo = $page.url.searchParams.get("redirect") ?? "/portal";

  async function handleSignIn() {
    if (!email || !password) { error = "Please fill in all fields."; return; }
    loading = true; error = "";
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Sign-in failed"); }
      await goto(redirectTo);
    } catch (e: unknown) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function requestOtp() {
    if (!email) { error = "Please enter your email."; return; }
    loading = true; error = "";
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed to send OTP"); }
      otpStep = "verify";
    } catch (e: unknown) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function verifyOtp() {
    if (!otp) { error = "Enter the 6-digit code."; return; }
    loading = true; error = "";
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Invalid code"); }
      await goto(redirectTo);
    } catch (e: unknown) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }
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
    </div>

    <!-- Card -->
    <div class="rounded-2xl p-8" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
      <!-- Mode tabs -->
      <div class="flex glass rounded-xl p-1 mb-6">
        <button on:click={() => { mode = "signin"; error = ""; }}
                class="flex-1 py-2 text-sm font-semibold rounded-lg transition-all {mode === 'signin' ? 'bg-emerald-700 text-white' : 'text-stone-500 hover:text-white'}">
          Password
        </button>
        <button on:click={() => { mode = "otp"; error = ""; otpStep = "request"; }}
                class="flex-1 py-2 text-sm font-semibold rounded-lg transition-all {mode === 'otp' ? 'bg-emerald-700 text-white' : 'text-stone-500 hover:text-white'}">
          Magic Link / OTP
        </button>
      </div>

      {#if mode === "signin"}
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-stone-400 mb-1.5">Email</label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600" />
              <input type="email" bind:value={email} placeholder="you@example.com" class="input-luxury pl-10" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-400 mb-1.5">Password</label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600" />
              <input type={showPassword ? "text" : "password"} bind:value={password} placeholder="••••••••" class="input-luxury pl-10 pr-10" />
              <button on:click={() => (showPassword = !showPassword)}
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-400 transition-colors">
                {#if showPassword}<EyeOff class="w-4 h-4" />{:else}<Eye class="w-4 h-4" />{/if}
              </button>
            </div>
          </div>
          {#if error}<p class="text-rose-400 text-xs">{error}</p>{/if}
          <button on:click={handleSignIn} disabled={loading}
                  class="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style="background: linear-gradient(135deg, #059669, #065f46)">
            {#if loading}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{:else}Sign In <ArrowRight class="w-4 h-4" />{/if}
          </button>
        </div>

      {:else}
        {#if otpStep === "request"}
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-stone-400 mb-1.5">Email</label>
              <div class="relative">
                <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600" />
                <input type="email" bind:value={email} placeholder="you@example.com" class="input-luxury pl-10" />
              </div>
            </div>
            <p class="text-stone-600 text-xs">We'll send a 6-digit code to your email — no password needed.</p>
            {#if error}<p class="text-rose-400 text-xs">{error}</p>{/if}
            <button on:click={requestOtp} disabled={loading}
                    class="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white"
                    style="background: linear-gradient(135deg, #D97706, #B45309)">
              {loading ? "Sending…" : "Send OTP"} <ArrowRight class="w-4 h-4" />
            </button>
          </div>
        {:else}
          <div class="space-y-4">
            <div class="text-center p-4 rounded-xl" style="background: rgba(5,150,105,0.1)">
              <p class="text-emerald-400 text-sm">Code sent to <strong>{email}</strong></p>
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-400 mb-1.5">6-digit code</label>
              <input type="text" bind:value={otp} placeholder="000000" maxlength={6} class="input-luxury text-center text-xl tracking-widest font-mono" />
            </div>
            {#if error}<p class="text-rose-400 text-xs">{error}</p>{/if}
            <button on:click={verifyOtp} disabled={loading}
                    class="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white"
                    style="background: linear-gradient(135deg, #059669, #065f46)">
              {loading ? "Verifying…" : "Verify & Sign In"} <ArrowRight class="w-4 h-4" />
            </button>
            <button on:click={() => { otpStep = "request"; otp = ""; error = ""; }} class="w-full text-stone-600 hover:text-stone-400 text-xs transition-colors">
              ← Change email
            </button>
          </div>
        {/if}
      {/if}
    </div>

    <p class="text-center text-stone-700 text-xs mt-6">
      Don't have an account? <a href="/register" class="text-emerald-500 hover:text-emerald-400">Create one →</a>
    </p>
  </div>
</div>
