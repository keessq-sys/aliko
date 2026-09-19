<script lang="ts">
  import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-svelte';
  
  let email = '';
  let password = '';
  let showPassword = false;
  let rememberMe = false;
  let loading = false;
  
  let errors = {
    email: '',
    password: ''
  };

  const validate = () => {
    let valid = true;
    errors = { email: '', password: '' };
    if (!email) {
      errors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
      valid = false;
    }
    if (!password) {
      errors.password = 'Password is required';
      valid = false;
    }
    return valid;
  };

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    if (!validate()) return;
    loading = true;
    setTimeout(() => {
      loading = false;
      alert('Login successful');
    }, 1500);
  };
</script>

<form on:submit={handleLogin} class="space-y-6">
  <div>
    <label for="email" class="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Mail class="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="email"
        id="email"
        bind:value={email}
        class="block w-full pl-10 pr-3 py-2.5 bg-black/20 border {errors.email ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-emerald-500'} rounded-lg text-white placeholder-gray-400 backdrop-blur-sm transition-all"
        placeholder="you@example.com"
      />
    </div>
    {#if errors.email}
      <p class="mt-1 text-sm text-red-400">{errors.email}</p>
    {/if}
  </div>

  <div>
    <label for="password" class="block text-sm font-medium text-gray-300 mb-1">Password</label>
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Lock class="h-5 w-5 text-gray-400" />
      </div>
      <input
        type={showPassword ? 'text' : 'password'}
        id="password"
        bind:value={password}
        class="block w-full pl-10 pr-10 py-2.5 bg-black/20 border {errors.password ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-emerald-500'} rounded-lg text-white placeholder-gray-400 backdrop-blur-sm transition-all"
        placeholder="••••••••"
      />
      <button
        type="button"
        class="absolute inset-y-0 right-0 pr-3 flex items-center"
        on:click={() => showPassword = !showPassword}
      >
        {#if showPassword}
          <EyeOff class="h-5 w-5 text-gray-400 hover:text-emerald-400 transition-colors" />
        {:else}
          <Eye class="h-5 w-5 text-gray-400 hover:text-emerald-400 transition-colors" />
        {/if}
      </button>
    </div>
    {#if errors.password}
      <p class="mt-1 text-sm text-red-400">{errors.password}</p>
    {/if}
  </div>

  <div class="flex items-center justify-between">
    <div class="flex items-center">
      <input
        id="remember-me"
        type="checkbox"
        bind:checked={rememberMe}
        class="h-4 w-4 rounded border-gray-600 text-emerald-600 focus:ring-emerald-600 bg-black/20"
      />
      <label for="remember-me" class="ml-2 block text-sm text-gray-300">Remember me</label>
    </div>
    <div class="text-sm">
      <a href="/auth/forgot-password" class="font-medium text-emerald-400 hover:text-emerald-300">Forgot password?</a>
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

  <div class="relative">
    <div class="absolute inset-0 flex items-center">
      <div class="w-full border-t border-white/10"></div>
    </div>
    <div class="relative flex justify-center text-sm">
      <span class="px-2 bg-transparent text-gray-400">or continue with</span>
    </div>
  </div>

  <button
    type="button"
    class="w-full flex items-center justify-center py-2.5 px-4 border border-gray-300/30 rounded-lg shadow-sm text-sm font-medium text-gray-200 bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors backdrop-blur-sm"
  >
    <svg class="h-5 w-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
    Continue with Google
  </button>
</form>
