<script lang="ts">
  import { Mail, Lock, User, Loader2, Building, Building2 } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { api } from '$lib/convex/_generated/api';
  import { runMutation } from '$lib/convex/queries';

  let contactName = '';
  let companyName = '';
  let email = '';
  let password = '';
  let terms = false;
  let loading = false;
  let errorMessage = '';
  let errors: Record<string, string> = {};

  const signUp = async (args: any) => runMutation(api.auth.signUp, args);

  const validate = () => {
    errors = {};
    if (!contactName.trim()) errors.contactName = 'Contact name is required';
    if (!companyName.trim()) errors.companyName = 'Company name is required';
    if (!email) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Email is invalid';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 8) errors.password = 'Minimum 8 characters';
    if (!terms) errors.terms = 'You must accept the terms';
    return Object.keys(errors).length === 0;
  };

  async function handleSubmit() {
    errorMessage = '';
    if (!validate()) return;
    loading = true;
    try {
      await signUp({
        provider: 'password',
        params: {
          flow: 'signUp',
          email: email.trim(),
          password,
          name: contactName.trim(),
          role: 'ESTATE_MANAGER'
        }
      } as any);
      if (typeof window !== 'undefined') localStorage.setItem('adk-role', 'ESTATE_MANAGER');
      await goto(`/register/manager?company=${encodeURIComponent(companyName.trim())}`);
    } catch (err: any) {
      errorMessage = err?.message ?? 'Sign-up failed. Please try again.';
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-5">
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <label class="block">
      <span class="mb-1 block text-sm font-medium text-gray-300">Contact Person</span>
      <div class="relative">
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <User class="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          autocomplete="name"
          bind:value={contactName}
          class="block w-full rounded-lg border {errors.contactName ? 'border-red-500' : 'border-white/10'} bg-black/20 min-h-[44px] py-2.5 pl-10 pr-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all"
          placeholder="Chidi Nwosu"
        />
      </div>
      {#if errors.contactName}<p class="mt-1 text-xs text-red-400">{errors.contactName}</p>{/if}
    </label>
    <label class="block">
      <span class="mb-1 block text-sm font-medium text-gray-300">Company Name</span>
      <div class="relative">
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Building class="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          autocomplete="organization"
          bind:value={companyName}
          class="block w-full rounded-lg border {errors.companyName ? 'border-red-500' : 'border-white/10'} bg-black/20 min-h-[44px] py-2.5 pl-10 pr-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all"
          placeholder="ADK Estates Ltd"
        />
      </div>
      {#if errors.companyName}<p class="mt-1 text-xs text-red-400">{errors.companyName}</p>{/if}
    </label>
  </div>

  <label class="block">
    <span class="mb-1 block text-sm font-medium text-gray-300">Corporate Email</span>
    <div class="relative">
      <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Mail class="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="email"
        inputmode="email"
        autocomplete="email"
        bind:value={email}
        class="block w-full rounded-lg border {errors.email ? 'border-red-500' : 'border-white/10'} bg-black/20 min-h-[44px] py-2.5 pl-10 pr-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all"
        placeholder="manager@company.com"
      />
    </div>
    {#if errors.email}<p class="mt-1 text-sm text-red-400">{errors.email}</p>{/if}
  </label>

  <label class="block">
    <span class="mb-1 block text-sm font-medium text-gray-300">Password</span>
    <div class="relative">
      <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Lock class="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="password"
        autocomplete="new-password"
        bind:value={password}
        class="block w-full rounded-lg border {errors.password ? 'border-red-500' : 'border-white/10'} bg-black/20 min-h-[44px] py-2.5 pl-10 pr-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all"
        placeholder="Min. 8 characters"
      />
    </div>
    {#if errors.password}<p class="mt-1 text-sm text-red-400">{errors.password}</p>{/if}
  </label>

  <label class="flex items-start gap-2 text-sm text-gray-300">
    <input type="checkbox" bind:checked={terms} class="mt-0.5 h-4 w-4 rounded border-gray-600 bg-black/20 text-blue-500 focus:ring-blue-500" />
    <span>I am authorised to enrol this company and accept the platform terms</span>
  </label>
  {#if errors.terms}<p class="text-sm text-red-400">{errors.terms}</p>{/if}

  {#if errorMessage}
    <p class="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">{errorMessage}</p>
  {/if}

  <button
    type="submit"
    disabled={loading}
    class="flex w-full justify-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-400 py-3 px-4 text-sm font-medium text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
  >
    {#if loading}
      <Loader2 class="mr-2 h-5 w-5 animate-spin" /> Creating account…
    {:else}
      <Building2 class="mr-2 h-5 w-5" /> Create Manager Account
    {/if}
  </button>
</form>
