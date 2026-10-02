<script lang="ts">
  import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import { api } from "$lib/convex/_generated/api";
  import { runAction } from "$lib/convex/queries";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher<{ forgotPassword: void }>();

  let email = "";
  let password = "";
  let showPassword = false;
  let loading = false;
  let errorMessage = "";

  let errors = {
    email: "",
    password: "",
  };

  const signIn = async (args: any) => runAction(api.auth.signIn, args);

  function roleDashboard(role: string | undefined): string {
    switch ((role ?? "CLIENT").toUpperCase()) {
      case "ADMIN":
        return "/admin";
      case "AGENT":
        return "/dashboard/agent";
      case "ESTATE_MANAGER":
        return "/dashboard/manager";
      default:
        return "/dashboard/client";
    }
  }

  const validate = () => {
    let valid = true;
    errors = { email: "", password: "" };
    if (!email) {
      errors.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email is invalid";
      valid = false;
    }
    if (!password) {
      errors.password = "Password is required";
      valid = false;
    }
    return valid;
  };

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    errorMessage = "";
    if (!validate()) return;
    loading = true;
    try {
      // @convex-dev/auth password sign-in: response sets the auth session
      const result: any = await signIn({
        provider: "password",
        params: { flow: "signIn", email: email.trim().toLowerCase(), password },
      } as any);
      const dashboard = roleDashboard(result?.role);
      const requested = new URL(window.location.href).searchParams.get(
        "redirect",
      );
      const destination = requested
        ? new URL(requested, window.location.origin)
        : null;
      const target =
        destination && destination.origin === window.location.origin
          ? destination.pathname + destination.search + destination.hash
          : dashboard;
      if (typeof window !== "undefined" && result?.role)
        localStorage.setItem("adk-role", result.role);
      await goto(target, { invalidateAll: true });
    } catch (err: any) {
      errorMessage = err?.message?.includes("InvalidAccountId")
        ? "No account found with those credentials."
        : (err?.message ?? "Sign-in failed. Please try again.");
    } finally {
      loading = false;
    }
  };
</script>

<form on:submit={handleLogin} class="space-y-6">
  <div>
    <label for="email" class="block text-sm font-medium text-gray-300 mb-1"
      >Email Address</label
    >
    <div class="relative">
      <div
        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
      >
        <Mail class="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="email"
        id="email"
        inputmode="email"
        autocomplete="email"
        bind:value={email}
        class="block w-full min-h-[44px] pl-10 pr-3 py-2.5 bg-black/20 border {errors.email
          ? 'border-red-500 focus:ring-red-500'
          : 'border-white/10 focus:ring-emerald-500'} rounded-lg text-white placeholder-gray-400 backdrop-blur-sm transition-all"
        placeholder="you@example.com"
      />
    </div>
    {#if errors.email}
      <p class="mt-1 text-sm text-red-400">{errors.email}</p>
    {/if}
  </div>

  <div>
    <label for="password" class="block text-sm font-medium text-gray-300 mb-1"
      >Password</label
    >
    <div class="relative">
      <div
        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
      >
        <Lock class="h-5 w-5 text-gray-400" />
      </div>
      <input
        type={showPassword ? "text" : "password"}
        id="password"
        autocomplete="current-password"
        bind:value={password}
        class="block w-full min-h-[44px] pl-10 pr-10 py-2.5 bg-black/20 border {errors.password
          ? 'border-red-500 focus:ring-red-500'
          : 'border-white/10 focus:ring-emerald-500'} rounded-lg text-white placeholder-gray-400 backdrop-blur-sm transition-all"
        placeholder="••••••••"
      />
      <button
        type="button"
        aria-label={showPassword ? "Hide password" : "Show password"}
        class="absolute inset-y-0 right-0 min-w-[44px] flex items-center justify-center"
        on:click={() => (showPassword = !showPassword)}
      >
        {#if showPassword}
          <EyeOff
            class="h-5 w-5 text-gray-400 hover:text-emerald-400 transition-colors"
          />
        {:else}
          <Eye
            class="h-5 w-5 text-gray-400 hover:text-emerald-400 transition-colors"
          />
        {/if}
      </button>
    </div>
    {#if errors.password}
      <p class="mt-1 text-sm text-red-400">{errors.password}</p>
    {/if}
  </div>

  {#if errorMessage}
    <p
      class="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300"
    >
      {errorMessage}
    </p>
  {/if}

  <div class="flex items-center justify-between">
    <div class="text-sm">
      <button
        type="button"
        on:click={() => dispatch("forgotPassword")}
        class="font-medium text-emerald-400 hover:text-emerald-300"
        >Forgot password?</button
      >
    </div>
  </div>

  <button
    type="submit"
    disabled={loading}
    class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transform transition hover:scale-[1.02] active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-70 disabled:cursor-not-allowed"
  >
    {#if loading}
      <Loader2 class="animate-spin h-5 w-5 mr-2" />
      Signing in...
    {:else}
      Sign In
    {/if}
  </button>
</form>
