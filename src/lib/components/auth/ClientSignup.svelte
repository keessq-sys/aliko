<script lang="ts">
  import { User, Mail, Phone, Lock, Eye, EyeOff, Check } from 'lucide-svelte';
  
  let fullName = '';
  let email = '';
  let phone = '';
  let password = '';
  let confirmPassword = '';
  let showPassword = false;
  let termsAccepted = false;
  
  let preferredLocations: string[] = [];
  let propertyInterests: string[] = [];

  const LOCATIONS = ['Abuja', 'Lagos', 'Port Harcourt', 'Kano', 'Enugu', 'Other'];
  const INTERESTS = ['Buy', 'Rent', 'Invest'];

  const toggleLocation = (loc: string) => {
    if (preferredLocations.includes(loc)) preferredLocations = preferredLocations.filter(l => l !== loc);
    else preferredLocations = [...preferredLocations, loc];
  };

  const toggleInterest = (interest: string) => {
    if (propertyInterests.includes(interest)) propertyInterests = propertyInterests.filter(i => i !== interest);
    else propertyInterests = [...propertyInterests, interest];
  };

  $: strength = calculatePasswordStrength(password);
  
  function calculatePasswordStrength(pass: string) {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  }

  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
</script>

<form class="space-y-5" on:submit|preventDefault={() => alert('Registering client')}>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
      <div class="relative">
        <User class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        <input type="text" bind:value={fullName} class="w-full pl-10 pr-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-emerald-500 focus:border-emerald-500" placeholder="John Doe" required />
      </div>
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1">Email</label>
      <div class="relative">
        <Mail class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        <input type="email" bind:value={email} class="w-full pl-10 pr-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-emerald-500 focus:border-emerald-500" placeholder="john@example.com" required />
      </div>
    </div>
  </div>

  <div>
    <label class="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
    <div class="relative flex">
      <span class="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-white/10 bg-black/40 text-gray-400 text-sm">
        +234
      </span>
      <input type="tel" bind:value={phone} class="flex-1 min-w-0 block w-full px-3 py-2 bg-black/20 border border-white/10 rounded-none rounded-r-lg text-white focus:ring-emerald-500 focus:border-emerald-500" placeholder="801 234 5678" required />
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1">Password</label>
      <div class="relative">
        <Lock class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        <input type={showPassword ? 'text' : 'password'} bind:value={password} class="w-full pl-10 pr-10 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-emerald-500 focus:border-emerald-500" placeholder="••••••••" required />
        <button type="button" class="absolute right-3 top-2.5" on:click={() => showPassword = !showPassword}>
          {#if showPassword}<EyeOff class="h-5 w-5 text-gray-400" />{:else}<Eye class="h-5 w-5 text-gray-400" />{/if}
        </button>
      </div>
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
      <div class="relative">
        <Lock class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        <input type={showPassword ? 'text' : 'password'} bind:value={confirmPassword} class="w-full pl-10 pr-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-emerald-500 focus:border-emerald-500" placeholder="••••••••" required />
      </div>
    </div>
  </div>

  {#if password}
    <div class="space-y-2">
      <div class="flex gap-1 h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
        {#each Array(4) as _, i}
          <div class="h-full flex-1 {i < strength ? strengthColors[strength-1] : 'bg-transparent'}"></div>
        {/each}
      </div>
      <p class="text-xs text-gray-400 text-right">{strength > 0 ? strengthLabels[strength-1] : ''}</p>
      <ul class="text-xs text-gray-400 space-y-1">
        <li class="flex items-center"><Check class="h-3 w-3 mr-1 {password.length >= 8 ? 'text-emerald-500' : 'text-gray-600'}" /> 8+ characters</li>
        <li class="flex items-center"><Check class="h-3 w-3 mr-1 {/[A-Z]/.test(password) ? 'text-emerald-500' : 'text-gray-600'}" /> Uppercase letter</li>
        <li class="flex items-center"><Check class="h-3 w-3 mr-1 {/[0-9]/.test(password) ? 'text-emerald-500' : 'text-gray-600'}" /> Number</li>
        <li class="flex items-center"><Check class="h-3 w-3 mr-1 {/[^A-Za-z0-9]/.test(password) ? 'text-emerald-500' : 'text-gray-600'}" /> Special character</li>
      </ul>
    </div>
  {/if}

  <div>
    <label class="block text-sm font-medium text-gray-300 mb-2">Preferred Locations</label>
    <div class="flex flex-wrap gap-2">
      {#each LOCATIONS as loc}
        <button type="button" on:click={() => toggleLocation(loc)} class="px-3 py-1 text-sm rounded-full border transition-colors {preferredLocations.includes(loc) ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/30'}">
          {loc}
        </button>
      {/each}
    </div>
  </div>

  <div>
    <label class="block text-sm font-medium text-gray-300 mb-2">I am looking to:</label>
    <div class="flex gap-4">
      {#each INTERESTS as interest}
        <label class="flex items-center space-x-2 text-sm text-gray-300 cursor-pointer">
          <input type="checkbox" checked={propertyInterests.includes(interest)} on:change={() => toggleInterest(interest)} class="rounded border-gray-600 bg-black/20 text-emerald-500 focus:ring-emerald-500" />
          <span>{interest}</span>
        </label>
      {/each}
    </div>
  </div>

  <div class="flex items-start">
    <input id="terms" type="checkbox" bind:checked={termsAccepted} class="mt-1 h-4 w-4 rounded border-gray-600 text-emerald-600 focus:ring-emerald-600 bg-black/20" required />
    <label for="terms" class="ml-2 block text-sm text-gray-400">
      I agree to the <a href="/terms" class="text-emerald-400 hover:underline">Terms of Service</a> and <a href="/privacy" class="text-emerald-400 hover:underline">Privacy Policy</a>
    </label>
  </div>

  <button type="submit" class="w-full flex justify-center py-3 px-4 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transform transition hover:scale-[1.02] active:scale-95">
    Create Client Account
  </button>
</form>
