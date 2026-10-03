<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();

  import PasswordField from "$lib/components/auth/PasswordField.svelte";
  import { passwordProblem } from "../../../../convex/lib/passwordPolicy";
  // Two-step password reset using Convex Auth's Password provider `reset`/
  // `reset-verification` flows (see convex/auth.ts + convex/ResendOTPPasswordReset.ts).
  // Step 1 emails a 6-digit code via Resend; step 2 verifies the code and
  // sets the new password. Neither step ever tells the caller whether the
  // email address has an account — errors are shown as one generic message
  // so this can't be used to enumerate registered emails.
  import {
    Mail,
    Lock,
    KeyRound,
    Loader2,
    CheckCircle2,
    ArrowLeft,
  } from "lucide-svelte";
  import { api } from "$lib/convex/_generated/api";
  import { runAction } from "$lib/convex/queries";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher<{ backToSignIn: void }>();

  let step: "request" | "verify" | "done" = "request";
  let email = "";
  let code = "";
  let newPassword = "";
  let confirmPassword = "";
  let loading = false;
  let errorMessage = "";

  const signIn = async (args: any) => runAction(api.auth.signIn, args);

  async function requestCode(e: Event) {
    e.preventDefault();
    errorMessage = "";
    if (!email.trim()) {
      errorMessage = "Please enter your email address.";
      return;
    }
    loading = true;
    try {
      await signIn({
        provider: "password",
        params: { flow: "reset", email: email.trim().toLowerCase() },
      });
      step = "verify";
    } catch (err: any) {
      // A configuration or delivery failure must not claim an email was sent.
      // Keep the failure message independent of whether an account exists.
      errorMessage =
        err?.message ===
        "Password recovery email is not configured. Please contact support."
          ? err.message
          : "Password recovery is temporarily unavailable. Please try again or contact support.";
    } finally {
      loading = false;
    }
  }

  async function verifyAndReset(e: Event) {
    e.preventDefault();
    errorMessage = "";
    if (!code.trim()) {
      errorMessage = "Please enter the 6-digit code from your email.";
      return;
    }
    if (passwordProblem(newPassword)) {
      errorMessage =
        "Use 12 or more characters including uppercase, lowercase, a number and a symbol.";
      return;
    }
    if (newPassword !== confirmPassword) {
      errorMessage = "Passwords do not match.";
      return;
    }
    loading = true;
    try {
      await signIn({
        provider: "password",
        params: {
          flow: "reset-verification",
          email: email.trim().toLowerCase(),
          code: code.trim(),
          newPassword,
        },
      });
      step = "done";
    } catch (err: any) {
      errorMessage = err?.message?.includes("Invalid code")
        ? "That code is invalid or expired. Please request a new one."
        : (err?.message ?? "Could not reset password. Please try again.");
    } finally {
      loading = false;
    }
  }
</script>

<div class="space-y-6">
  <button
    type="button"
    on:click={() => dispatch("backToSignIn")}
    class="flex items-center gap-1.5 text-xs text-stone-400 hover:text-emerald-400"
  >
    <ArrowLeft size={14} /> {$adkT("Back to sign in")} </button>

  {#if step === "done"}
    <div class="text-center py-6">
      <CheckCircle2 class="mx-auto mb-3 h-10 w-10 text-emerald-400" />
      <h2 class="text-lg font-bold text-white">{$adkT("Password updated")}</h2>
      <p class="mt-1 text-sm text-gray-400"> {$adkT("You can now sign in with your new password.")} </p>
      <button
        type="button"
        on:click={() => dispatch("backToSignIn")}
        class="btn-primary mt-6 w-full min-h-[44px] py-3"
      > {$adkT("Go to Sign In")} </button>
    </div>
  {:else if step === "request"}
    <form on:submit={requestCode} class="space-y-5">
      <div>
        <h2 class="text-lg font-bold text-white">{$adkT("Reset your password")}</h2>
        <p class="mt-1 text-sm text-gray-400"> {$adkT("Enter your email and we'll send a 6-digit reset code.")} </p>
      </div>
      <div class="relative">
        <div
          class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
        >
          <Mail class="h-5 w-5 text-gray-400" />
        </div>
        <input dir="auto"
          type="email"
          inputmode="email"
          autocomplete="email"
          bind:value={email}
          placeholder={$adkT("you@example.com")}
          class="block w-full min-h-[44px] rounded-lg border border-white/10 bg-black/20 py-2.5 pl-10 pr-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      {#if errorMessage}
        <p
          class="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300"
        >
          {$adkT(errorMessage)}
        </p>
      {/if}
      <button
        type="submit"
        disabled={loading}
        class="btn-primary flex w-full min-h-[44px] items-center justify-center gap-2 py-3 disabled:opacity-60"
      >
        {#if loading}<Loader2 class="h-4 w-4 animate-spin" />{/if} {$adkT("Send reset code")} </button>
    </form>
  {:else}
    <form on:submit={verifyAndReset} class="space-y-5">
      <div>
        <h2 class="text-lg font-bold text-white">{$adkT("Enter your reset code")}</h2>
        <p class="mt-1 text-sm text-gray-400"> {$adkT("Check")} <span class="text-white">{email}</span> {$adkT("for a 6-digit code, then choose a new password.")} </p>
      </div>
      <div class="relative">
        <div
          class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
        >
          <KeyRound class="h-5 w-5 text-gray-400" />
        </div>
        <input dir="auto"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          bind:value={code}
          placeholder={$adkT("6-digit code")}
          maxlength="6"
          class="block w-full min-h-[44px] rounded-lg border border-white/10 bg-black/20 py-2.5 pl-10 pr-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      <div class="relative">
        <div
          class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
        >
          <Lock class="h-5 w-5 text-gray-400" />
        </div>
        <PasswordField
          strength={true}
          autocomplete="new-password"
          bind:value={newPassword}
          placeholder={$adkT("New password")}
          class="block w-full min-h-[44px] rounded-lg border border-white/10 bg-black/20 py-2.5 pl-10 pr-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      <div class="relative">
        <div
          class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
        >
          <Lock class="h-5 w-5 text-gray-400" />
        </div>
        <PasswordField
          autocomplete="new-password"
          bind:value={confirmPassword}
          placeholder={$adkT("Confirm new password")}
          class="block w-full min-h-[44px] rounded-lg border border-white/10 bg-black/20 py-2.5 pl-10 pr-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      {#if errorMessage}
        <p
          class="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300"
        >
          {$adkT(errorMessage)}
        </p>
      {/if}
      <button
        type="submit"
        disabled={loading}
        class="btn-primary flex w-full min-h-[44px] items-center justify-center gap-2 py-3 disabled:opacity-60"
      >
        {#if loading}<Loader2 class="h-4 w-4 animate-spin" />{/if} {$adkT("Reset password")} </button>
      <button
        type="button"
        on:click={() => (step = "request")}
        class="w-full text-center text-xs text-stone-400 hover:text-emerald-400"
      > {$adkT("Didn't get a code? Try a different email")} </button>
    </form>
  {/if}
</div>
