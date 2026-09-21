<script lang="ts">
  import { Shield, CheckCircle, Award } from 'lucide-svelte';
  import { fade } from 'svelte/transition';
  import { page } from '$app/stores';
  import LoginForm from '$lib/components/auth/LoginForm.svelte';
  import ForgotPasswordForm from '$lib/components/auth/ForgotPasswordForm.svelte';
  import ClientSignup from '$lib/components/auth/ClientSignup.svelte';
  import AgentSignup from '$lib/components/auth/AgentSignup.svelte';
  import ManagerSignup from '$lib/components/auth/ManagerSignup.svelte';

  const tabParam = $page.url.searchParams.get('tab');
  let activeTab: 'signin' | 'signup' | 'reset' = tabParam === 'signup' ? 'signup' : 'signin';
  let activeRole: 'client' | 'agent' | 'manager' = 'client';
</script>

<div class="min-h-screen bg-[#050A0E] flex relative overflow-hidden">
  <div class="hidden lg:flex lg:w-1/2 relative bg-black items-center justify-center overflow-hidden">
    <div class="absolute inset-0 bg-[url('https://picsum.photos/seed/adk/1200/1600')] bg-cover bg-center opacity-40"></div>
    <div class="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"></div>
    
    <div class="relative z-10 p-12 max-w-xl">
      <div class="backdrop-blur-xl bg-white/10 border border-white/20 p-8 rounded-2xl shadow-2xl">
        <h2 class="text-4xl font-bold text-white mb-4 leading-tight">Nigeria's Most Trusted Property Platform</h2>
        <p class="text-gray-300 text-lg mb-8">Discover premium properties, connect with verified agents, and manage your real estate portfolio with ease.</p>
        
        <div class="space-y-4 mb-10">
          <div class="flex items-center text-emerald-400">
            <Shield class="h-6 w-6 mr-3" />
            <span class="text-white font-medium">100% Secure Transactions</span>
          </div>
          <div class="flex items-center text-emerald-400">
            <CheckCircle class="h-6 w-6 mr-3" />
            <span class="text-white font-medium">Verified Property Listings</span>
          </div>
          <div class="flex items-center text-emerald-400">
            <Award class="h-6 w-6 mr-3" />
            <span class="text-white font-medium">Certified Real Estate Professionals</span>
          </div>
        </div>

        <blockquote class="border-l-4 border-emerald-500 pl-4 italic text-gray-300">
          "Aliko Diamond Key completely transformed how we buy properties in Abuja. The verification process gives total peace of mind."
          <footer class="text-emerald-400 font-semibold mt-2">— Amina Bello, Investor</footer>
        </blockquote>
      </div>
    </div>
  </div>

  <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[120px] top-[-100px] right-[-100px]"></div>
      <div class="absolute w-[400px] h-[400px] bg-amber-600/10 rounded-full blur-[100px] bottom-[-50px] left-[-100px]"></div>
    </div>

    <div class="w-full max-w-md backdrop-blur-2xl bg-white/5 border border-white/10 p-8 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 mb-4 shadow-lg shadow-emerald-500/30">
          <Shield class="h-7 w-7 text-white" />
        </div>
        <h1 class="text-3xl font-bold text-white tracking-tight">Aliko Diamond Key</h1>
        <p class="text-gray-400 mt-2">Welcome back to premium real estate</p>
      </div>

      <div class="flex p-1 bg-black/40 rounded-xl mb-8">
        <button 
          class="flex-1 py-2.5 text-sm font-medium rounded-lg transition-all {activeTab === 'signin' ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-gray-400 hover:text-white'}"
          on:click={() => activeTab = 'signin'}
        >
          Sign In
        </button>
        <button 
          class="flex-1 py-2.5 text-sm font-medium rounded-lg transition-all {activeTab === 'signup' ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-gray-400 hover:text-white'}"
          on:click={() => activeTab = 'signup'}
        >
          Create Account
        </button>
      </div>

      <div class="relative min-h-[400px]">
        {#if activeTab === 'signin'}
          <div in:fade={{ duration: 200 }}>
            <LoginForm on:forgotPassword={() => (activeTab = 'reset')} />
          </div>
        {:else if activeTab === 'reset'}
          <div in:fade={{ duration: 200 }}>
            <ForgotPasswordForm on:backToSignIn={() => (activeTab = 'signin')} />
          </div>
        {:else}
          <div in:fade={{ duration: 200 }} class="flex flex-col space-y-6">
            <div class="grid grid-cols-3 gap-2">
              <button 
                class="flex flex-col items-center justify-center p-3 rounded-xl border transition-all {activeRole === 'client' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5'}"
                on:click={() => activeRole = 'client'}
              >
                <span class="text-xl mb-1">🏠</span>
                <span class="text-xs font-medium">Buyer/Renter</span>
              </button>
              <button 
                class="flex flex-col items-center justify-center p-3 rounded-xl border transition-all {activeRole === 'agent' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5'}"
                on:click={() => activeRole = 'agent'}
              >
                <span class="text-xl mb-1">🏆</span>
                <span class="text-xs font-medium">Agent</span>
              </button>
              <button 
                class="flex flex-col items-center justify-center p-3 rounded-xl border transition-all {activeRole === 'manager' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5'}"
                on:click={() => activeRole = 'manager'}
              >
                <span class="text-xl mb-1">🏢</span>
                <span class="text-xs font-medium">Manager</span>
              </button>
            </div>

            <p class="text-sm text-center text-gray-400">
              {#if activeRole === 'client'}Find your dream home or next investment.
              {:else if activeRole === 'agent'}List properties, connect with clients, and grow your business.
              {:else}Manage estates, handle multiple properties and agents efficiently.{/if}
            </p>

            <div class="pt-2">
              {#if activeRole === 'client'}<ClientSignup />{/if}
              {#if activeRole === 'agent'}<AgentSignup />{/if}
              {#if activeRole === 'manager'}<ManagerSignup />{/if}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
